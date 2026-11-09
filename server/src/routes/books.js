import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { supabase, BUCKET } from '../supabase.js';
import { extractEpubMeta } from '../epubMeta.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

const publicUrl = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
const extFromMime = (m = '') => (m.includes('png') ? 'png' : m.includes('webp') ? 'webp' : 'jpg');

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', upload.single('epub'), async (req, res) => {
  try {
    const file = req.file;
    const { category_id } = req.body;
    if (!file) return res.status(400).json({ error: 'Choose an .epub file' });
    if (!/\.epub$/i.test(file.originalname))
      return res.status(400).json({ error: 'Only .epub files are supported' });
    if (!category_id) return res.status(400).json({ error: 'Choose a genre' });

    const meta = extractEpubMeta(file.buffer);
    const title =
      (req.body.title || '').trim() ||
      meta.title ||
      file.originalname.replace(/\.epub$/i, '');
    const author = (req.body.author || '').trim() || meta.author || null;

    const id = randomUUID();
    const epubPath = `epubs/${id}.epub`;
    const up = await supabase.storage
      .from(BUCKET)
      .upload(epubPath, file.buffer, { contentType: 'application/epub+zip' });
    if (up.error) throw up.error;

    let coverPath = null;
    if (meta.cover) {
      coverPath = `covers/${id}.${extFromMime(meta.cover.mime)}`;
      const c = await supabase.storage
        .from(BUCKET)
        .upload(coverPath, meta.cover.buffer, { contentType: meta.cover.mime });
      if (c.error) coverPath = null;
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        id,
        title,
        author,
        category_id,
        epub_path: epubPath,
        epub_url: publicUrl(epubPath),
        cover_path: coverPath,
        cover_url: coverPath ? publicUrl(coverPath) : null,
      })
      .select()
      .single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([epubPath, coverPath].filter(Boolean));
      throw error;
    }
    res.status(201).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
});

router.patch('/:id', async (req, res) => {
  const patch = {};
  for (const k of ['title', 'author', 'category_id']) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const { data, error } = await supabase
    .from('books')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { data: book } = await supabase
    .from('books')
    .select('epub_path, cover_path')
    .eq('id', req.params.id)
    .single();
  if (book) {
    await supabase.storage.from(BUCKET).remove([book.epub_path, book.cover_path].filter(Boolean));
  }
  const { error } = await supabase.from('books').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;

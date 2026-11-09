import { Router } from 'express';
import { supabase, BUCKET } from '../supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position')
    .order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Genre name is required' });

  const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, position: count ?? 0 })
    .select()
    .single();
  if (error) {
    const msg = error.code === '23505' ? 'That genre already exists' : error.message;
    return res.status(400).json({ error: msg });
  }
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Genre name is required' });
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  // remove files of every book on this shelf first (DB rows cascade)
  const { data: books } = await supabase
    .from('books')
    .select('epub_path, cover_path')
    .eq('category_id', req.params.id);
  const paths = (books || []).flatMap((b) => [b.epub_path, b.cover_path]).filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);

  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;

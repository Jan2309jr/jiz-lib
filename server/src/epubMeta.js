import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import path from 'node:path';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});
const arr = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x]);
const text = (x) =>
  x == null ? '' : typeof x === 'object' ? String(x['#text'] ?? '') : String(x);

/** Reads title, author and cover image out of an .epub buffer. Never throws. */
export function extractEpubMeta(buffer) {
  try {
    const zip = new AdmZip(buffer);
    const container = parser.parse(zip.readAsText('META-INF/container.xml'));
    const opfPath = arr(container.container.rootfiles.rootfile)[0]['@_full-path'];
    const opf = parser.parse(zip.readAsText(opfPath)).package;
    const md = opf.metadata || {};

    const title = text(arr(md.title)[0]).trim();
    const author = text(arr(md.creator)[0]).trim();

    const manifest = arr(opf.manifest?.item);
    const metaCover = arr(md.meta).find((m) => m['@_name'] === 'cover');
    let coverItem =
      (metaCover && manifest.find((i) => i['@_id'] === metaCover['@_content'])) ||
      manifest.find((i) => (i['@_properties'] || '').includes('cover-image')) ||
      manifest.find(
        (i) => /cover/i.test(i['@_id'] || '') && /^image\//.test(i['@_media-type'] || '')
      );

    let cover = null;
    if (coverItem) {
      const dir = path.posix.dirname(opfPath);
      const href = decodeURIComponent(coverItem['@_href']);
      const entry = zip.getEntry(dir === '.' ? href : path.posix.join(dir, href));
      if (entry) cover = { buffer: entry.getData(), mime: coverItem['@_media-type'] };
    }
    return { title, author, cover };
  } catch {
    return { title: '', author: '', cover: null };
  }
}

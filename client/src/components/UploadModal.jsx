import { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

export default function UploadModal({ categories, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!file) return setError('Choose an .epub file first.');
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('epub', file);
    fd.append('category_id', categoryId);
    if (title.trim()) fd.append('title', title.trim());
    if (author.trim()) fd.append('author', author.trim());
    try {
      await api.uploadBook(fd);
      onUploaded();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a book" onClose={onClose}>
      <div className="form">
        <label>
          EPUB file
          <input type="file" accept=".epub,application/epub+zip" onChange={(e) => setFile(e.target.files[0])} />
        </label>
        <label>
          Genre
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title <small>(optional, read from the file if empty)</small>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Author <small>(optional)</small>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </label>
        {error && <p className="notice error">{error}</p>}
        <div className="actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={submit} disabled={busy}>
            {busy ? 'Shelving…' : 'Put on shelf'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

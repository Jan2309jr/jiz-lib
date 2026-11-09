import { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

export default function GenreManager({ categories, onClose, onChanged }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const add = () =>
    name.trim() &&
    run(async () => {
      await api.addCategory(name.trim());
      setName('');
    });

  const rename = (c) => {
    const next = prompt('Rename genre', c.name);
    if (next && next.trim() && next.trim() !== c.name) run(() => api.renameCategory(c.id, next.trim()));
  };

  const remove = (c) => {
    if (confirm(`Delete "${c.name}"? Every book on this shelf will be deleted too.`))
      run(() => api.deleteCategory(c.id));
  };

  return (
    <Modal title="Genres" onClose={onClose}>
      <div className="form">
        <div className="inline">
          <input
            placeholder="New genre, e.g. Science fiction"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className="btn" onClick={add} disabled={busy || !name.trim()}>
            Add shelf
          </button>
        </div>
        {error && <p className="notice error">{error}</p>}
        <ul className="genre-list">
          {categories.map((c) => (
            <li key={c.id}>
              <span>{c.name}</span>
              <span>
                <button className="link" onClick={() => rename(c)}>
                  Rename
                </button>
                <button className="link danger" onClick={() => remove(c)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
          {!categories.length && <li className="muted">No genres yet.</li>}
        </ul>
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

export default function BookDetail({ book, category, onClose, onRead, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    if (!confirm(`Remove "${book.title}" from the library? The file will be deleted.`)) return;
    setBusy(true);
    try {
      await api.deleteBook(book.id);
      onDeleted();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={book.title} onClose={onClose}>
      <div className="detail">
        {book.cover_url ? (
          <img className="cover" src={book.cover_url} alt={`Cover of ${book.title}`} />
        ) : (
          <div className="cover blank">{book.title}</div>
        )}
        <div className="detail-info">
          <p className="author">{book.author || 'Unknown author'}</p>
          <p className="meta">Shelved under {category?.name || 'unknown genre'}</p>
          {error && <p className="notice error">{error}</p>}
          <div className="actions">
            <button className="btn" onClick={onRead}>
              Read book
            </button>
            <a className="btn ghost" href={book.epub_url} download>
              Download .epub
            </a>
            <button className="btn danger" onClick={remove} disabled={busy}>
              Remove
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

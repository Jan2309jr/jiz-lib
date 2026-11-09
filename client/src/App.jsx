import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Bookshelf from './components/Bookshelf.jsx';
import BookDetail from './components/BookDetail.jsx';
import Reader from './components/Reader.jsx';
import UploadModal from './components/UploadModal.jsx';
import GenreManager from './components/GenreManager.jsx';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null); // book shown in detail
  const [reading, setReading] = useState(null); // book open in reader
  const [showUpload, setShowUpload] = useState(false);
  const [showGenres, setShowGenres] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, b] = await Promise.all([api.getCategories(), api.getBooks()]);
      setCategories(c);
      setBooks(b);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>The Library</h1>
        <p className="count">
          {books.length} {books.length === 1 ? 'book' : 'books'} on {categories.length}{' '}
          {categories.length === 1 ? 'shelf' : 'shelves'}
        </p>
        <div className="actions">
          <button className="btn ghost" onClick={() => setShowGenres(true)}>
            Manage genres
          </button>
          <button
            className="btn"
            onClick={() => setShowUpload(true)}
            disabled={!categories.length}
            title={!categories.length ? 'Create a genre first' : ''}
          >
            Add a book
          </button>
        </div>
      </header>

      {error && (
        <p className="notice error">
          Can't reach the library: {error}. Check that the server is running and your Supabase keys
          are set.
        </p>
      )}

      {loading ? (
        <p className="notice">Dusting off the shelves…</p>
      ) : (
        <Bookshelf
          categories={categories}
          books={books}
          onOpen={setSelected}
          onAddGenre={() => setShowGenres(true)}
        />
      )}

      {selected && (
        <BookDetail
          book={selected}
          category={categories.find((c) => c.id === selected.category_id)}
          onClose={() => setSelected(null)}
          onRead={() => {
            setReading(selected);
            setSelected(null);
          }}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}

      {reading && <Reader book={reading} onClose={() => setReading(null)} />}

      {showUpload && (
        <UploadModal
          categories={categories}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            load();
          }}
        />
      )}

      {showGenres && (
        <GenreManager
          categories={categories}
          onClose={() => setShowGenres(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}

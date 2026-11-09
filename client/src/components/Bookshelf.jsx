import { useMemo } from 'react';

// Muted leather / cloth tones that sit well on a dark wall
const SPINES = [
  ['#5b2a2a', '#d9c7a3'],
  ['#2f4a45', '#d6d2bf'],
  ['#3b3f5c', '#d8d3c4'],
  ['#6d5a3a', '#efe6cf'],
  ['#44352c', '#d4bd98'],
  ['#4a5a3d', '#e3dcc4'],
  ['#6b3d4a', '#e8d9cf'],
  ['#2b3d52', '#d1cdbd'],
  ['#7a5f48', '#f0e4d0'],
  ['#38383d', '#cfc6b0'],
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Spine({ book, onOpen }) {
  const h = useMemo(() => hash(book.id), [book.id]);
  const [bg, fg] = SPINES[h % SPINES.length];
  const height = 150 + (h % 70); // 150-219px
  const width = 34 + ((h >> 4) % 22); // 34-55px
  const tilt = (h >> 8) % 11 === 0 ? ((h >> 12) % 2 ? 3 : -3) : 0; // a few lean slightly

  return (
    <button
      className="spine"
      style={{ '--bg': bg, '--fg': fg, '--tilt': `${tilt}deg`, height, width }}
      onClick={() => onOpen(book)}
      aria-label={`${book.title}${book.author ? ` by ${book.author}` : ''}`}
      title={book.title}
    >
      <span className="band" />
      <span className="spine-title">{book.title}</span>
      {book.author && <span className="spine-author">{book.author}</span>}
      <span className="band" />
    </button>
  );
}

export default function Bookshelf({ categories, books, onOpen, onAddGenre }) {
  if (!categories.length) {
    return (
      <div className="empty">
        <p>The wall is bare. Create your first genre and it becomes a shelf.</p>
        <button className="btn" onClick={onAddGenre}>
          Create a genre
        </button>
      </div>
    );
  }

  return (
    <main className="case">
      {categories.map((cat) => {
        const items = books.filter((b) => b.category_id === cat.id);
        return (
          <section className="slab" key={cat.id} aria-label={cat.name}>
            <div className="row">
              {items.length ? (
                items.map((b) => <Spine key={b.id} book={b} onOpen={onOpen} />)
              ) : (
                <p className="row-empty">Nothing here yet</p>
              )}
            </div>
            <div className="board">
              <span className="plaque">{cat.name}</span>
            </div>
          </section>
        );
      })}
    </main>
  );
}

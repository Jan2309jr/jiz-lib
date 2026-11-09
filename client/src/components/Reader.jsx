import { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';

export default function Reader({ book, onClose }) {
  const viewer = useRef(null);
  const rendition = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('reader:font')) || 110);

  useEffect(() => {
    let dead = false;
    let epub;

    (async () => {
      try {
        const buf = await (await fetch(book.epub_url)).arrayBuffer();
        if (dead) return;
        epub = ePub(buf);
        const r = epub.renderTo(viewer.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
        });
        rendition.current = r;

        r.themes.register('night', {
          body: { background: '#15120f !important', color: '#d9d2c3 !important', 'line-height': '1.7 !important' },
          'a, a:link, a:visited': { color: '#c4a97d !important' },
          img: { 'max-width': '100% !important' },
        });
        r.themes.select('night');
        r.themes.fontSize(`${fontSize}%`);

        r.on('relocated', (loc) => localStorage.setItem(`cfi:${book.id}`, loc.start.cfi));
        r.on('keyup', (e) => {
          if (e.key === 'ArrowRight') r.next();
          if (e.key === 'ArrowLeft') r.prev();
        });

        await r.display(localStorage.getItem(`cfi:${book.id}`) || undefined);
        const nav = await epub.loaded.navigation;
        if (!dead) {
          setToc(nav.toc);
          setStatus('ready');
        }
      } catch (e) {
        console.error(e);
        if (!dead) setStatus('error');
      }
    })();

    const onKey = (e) => {
      if (e.key === 'ArrowRight') rendition.current?.next();
      if (e.key === 'ArrowLeft') rendition.current?.prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      dead = true;
      window.removeEventListener('keydown', onKey);
      try {
        rendition.current?.destroy();
        epub?.destroy();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  function changeFont(delta) {
    const next = Math.min(200, Math.max(70, fontSize + delta));
    setFontSize(next);
    localStorage.setItem('reader:font', next);
    rendition.current?.themes.fontSize(`${next}%`);
  }

  return (
    <div className="reader">
      <div className="reader-bar">
        <button className="btn ghost" onClick={onClose}>
          Back to shelf
        </button>
        <span className="reader-title">{book.title}</span>
        <div className="actions">
          <button className="btn ghost" onClick={() => setShowToc((s) => !s)} disabled={!toc.length}>
            Contents
          </button>
          <button className="btn ghost" onClick={() => changeFont(-10)} aria-label="Smaller text">
            A−
          </button>
          <button className="btn ghost" onClick={() => changeFont(10)} aria-label="Larger text">
            A+
          </button>
        </div>
      </div>

      <div className="reader-body">
        {showToc && (
          <nav className="toc">
            {toc.map((t) => (
              <button
                key={t.id || t.href}
                onClick={() => {
                  rendition.current?.display(t.href);
                  setShowToc(false);
                }}
              >
                {t.label.trim()}
              </button>
            ))}
          </nav>
        )}
        <button className="turn left" onClick={() => rendition.current?.prev()} aria-label="Previous page">
          ‹
        </button>
        <div className="page" ref={viewer} />
        <button className="turn right" onClick={() => rendition.current?.next()} aria-label="Next page">
          ›
        </button>
        {status === 'loading' && <p className="reader-msg">Opening the book…</p>}
        {status === 'error' && <p className="reader-msg">This file couldn't be opened. Try downloading it instead.</p>}
      </div>
    </div>
  );
}

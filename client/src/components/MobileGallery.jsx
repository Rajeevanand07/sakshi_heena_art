import { useEffect, useMemo, useRef, useState } from 'react';

// Phone version of the gallery: one column you scroll up and down, like a
// normal page. Same photos and heading blocks as the desktop canvas, in
// reading order (top to bottom of the layout). No WebGL, no edge effect.
//
// Photos alternate between full width and narrower, left/right, so it still
// feels like a gallery wall rather than a plain feed.
const WIDTHS = [
  { w: 100, side: 'left' },
  { w: 78, side: 'right' },
  { w: 86, side: 'left' },
  { w: 100, side: 'left' },
  { w: 72, side: 'right' },
  { w: 90, side: 'right' },
  { w: 80, side: 'left' },
];

export default function MobileGallery({ items, intro = true, onReady }) {
  const rootRef = useRef(null);
  const [shown, setShown] = useState(false);

  // Reading order: top to bottom, then left to right, with the first heading
  // block ("Sakshi Heena Art") always opening the page.
  const ordered = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
    const intro = items.find((it) => it.type === 'text');
    return intro ? [intro, ...sorted.filter((it) => it !== intro)] : sorted;
  }, [items]);

  // Nothing heavy to prepare: ready straight away (lets the loader finish).
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (intro) setShown(true);
  }, [intro]);

  // Each block fades/slides up once as it scrolls into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !shown) return undefined;
    const els = root.querySelectorAll('.m-gallery__item');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { root, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown]);

  let photoIndex = 0;
  return (
    <div ref={rootRef} className={`m-gallery${shown ? ' is-shown' : ''}`}>
      {ordered.map((item, i) => {
        if (item.type === 'text') {
          return (
            <section key={item.id} className="m-gallery__item m-gallery__text">
              <h2 className="m-gallery__heading">{item.heading}</h2>
              <p className="m-gallery__meta">
                <span>{item.meta}</span>
                <span className="m-gallery__tag">{item.tag}</span>
              </p>
              <p className="m-gallery__body">{item.body}</p>
            </section>
          );
        }
        const shape = WIDTHS[photoIndex++ % WIDTHS.length];
        const img = item.image;
        return (
          <figure
            key={item.id}
            className={`m-gallery__item m-gallery__photo m-gallery__photo--${shape.side}`}
            style={{ width: `${shape.w}%` }}
          >
            <span className="m-gallery__index">{String(item.id).padStart(2, '0')}</span>
            {img && (
              <div
                className="m-gallery__media"
                style={{ aspectRatio: `${img.width} / ${img.height}`, backgroundImage: `url("${img.blur}")` }}
              >
                <img
                  src={img.src}
                  srcSet={img.srcSet.map((s) => `${s.src} ${s.w}w`).join(', ')}
                  sizes={`${shape.w}vw`}
                  alt={`${item.title}, ${item.subtitle}`}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            )}
            <figcaption className="m-gallery__caption">
              <span>{item.title}</span>
              <span className="m-gallery__subtitle">{item.subtitle}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

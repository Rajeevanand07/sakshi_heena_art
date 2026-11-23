import { useEffect, useRef } from 'react';

// Endless sideways photo strip. While the pointer is over it, the mouse wheel
// scrolls it left/right (instead of the page); touch and mouse can drag it.
// The photos repeat, so it never runs out.
//
// Performance: one transform on one element, animated only while moving.

const EASE = 0.1;

const mod = (n, m) => ((n % m) + m) % m;

export default function HScroller({ photos, label = 'Photos' }) {
  const viewRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const view = viewRef.current;
    const track = trackRef.current;
    if (!view || !track) return undefined;

    let pos = 0; // current offset (px)
    let target = 0; // where we're easing to
    let setWidth = 1; // width of one full set of photos
    let raf = null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measure = () => {
      // The track holds 3 copies of the set; one copy's width is a third.
      setWidth = Math.max(1, track.scrollWidth / 3);
    };

    const draw = () => {
      // Show the middle copy, wrapped so it's always covered both sides.
      const x = -mod(pos, setWidth) - setWidth;
      track.style.transform = `translate3d(${x}px,0,0)`;
    };

    const tick = () => {
      const diff = target - pos;
      pos += reduce ? diff : diff * EASE;
      draw();
      if (Math.abs(diff) > 0.3) raf = requestAnimationFrame(tick);
      else {
        pos = target;
        draw();
        raf = null;
      }
    };
    const kick = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const onWheel = (e) => {
      e.preventDefault();
      // Vertical wheel moves the strip sideways; trackpads' sideways swipe too.
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      target += delta * (e.deltaMode === 1 ? 32 : 1);
      kick();
    };

    // Drag (touch + mouse).
    let dragging = false;
    let lastX = 0;
    let vel = 0;
    let lastT = 0;
    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      vel = 0;
      view.setPointerCapture?.(e.pointerId);
      view.classList.add('is-dragging');
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const now = performance.now();
      vel = dx / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
      target -= dx;
      pos = target; // follow the finger exactly
      draw();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      view.classList.remove('is-dragging');
      target -= vel * 260; // small glide after a flick
      kick();
    };

    const onKey = (e) => {
      if (e.key === 'ArrowRight') target += 300;
      else if (e.key === 'ArrowLeft') target -= 300;
      else return;
      e.preventDefault();
      kick();
    };

    measure();
    draw();
    const ro = new ResizeObserver(() => {
      measure();
      draw();
    });
    ro.observe(track);

    view.addEventListener('wheel', onWheel, { passive: false });
    view.addEventListener('pointerdown', onDown);
    view.addEventListener('pointermove', onMove);
    view.addEventListener('pointerup', onUp);
    view.addEventListener('pointercancel', onUp);
    view.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      view.removeEventListener('wheel', onWheel);
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);
      view.removeEventListener('keydown', onKey);
    };
  }, [photos]);

  const copies = [0, 1, 2];
  return (
    <div
      ref={viewRef}
      className="hscroll"
      role="region"
      aria-label={`${label} (scroll sideways)`}
      tabIndex={0}
    >
      <div ref={trackRef} className="hscroll__track">
        {copies.map((c) =>
          photos.map((p) => (
            <figure
              key={`${c}-${p.name}`}
              className="hscroll__item"
              style={{ aspectRatio: `${p.width} / ${p.height}`, backgroundImage: `url("${p.blur}")` }}
              aria-hidden={c !== 1 ? 'true' : undefined}
            >
              <img
                src={p.src}
                srcSet={p.srcSet.map((s) => `${s.src} ${s.w}w`).join(', ')}
                sizes="(max-width: 767px) 80vw, 50vw"
                alt={c === 1 ? 'Mehndi design by Sakshi Anand' : ''}
                draggable="false"
                decoding="async"
              />
            </figure>
          )),
        )}
      </div>
    </div>
  );
}


import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { itemBox } from '../data/layout.js';

// ---- Tuning ----
const MOBILE_BREAKPOINT = 768;
const MOBILE_SCALE = 0.55; // layout is shrunk on phones
const EASE = 0.09; // smoothing per 60fps frame (lower = smoother/slower)
const INERTIA_MS = 320; // how far a flick keeps gliding
const KEY_STEP = 220;
// Opening animation
const INTRO_MS = 1400; // how long the zoom-in takes
const INTRO_ZOOM = 0.82; // starting size (1 = normal)
const INTRO_SPEED = 26; // how hard the edge effect fires at the start

const mod = (n, m) => ((n % m) + m) % m;

// Works out how many copies of the block are needed so the screen is always
// covered, and the base position of every copy of every item.
function computeLayout(items, blockWidth, blockHeight) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = vw < MOBILE_BREAKPOINT ? MOBILE_SCALE : 1;

  const bw = blockWidth * scale;
  const bh = blockHeight * scale;
  const boxes = items.map(itemBox);
  const padX = Math.max(...boxes.map((b) => b.w)) * scale;
  const padY = Math.max(...boxes.map((b) => b.h)) * scale;

  const repeatX = Math.max(1, Math.ceil((vw + padX) / bw));
  const repeatY = Math.max(1, Math.ceil((vh + padY) / bh));

  const copies = [];
  for (let ry = 0; ry < repeatY; ry++) {
    for (let rx = 0; rx < repeatX; rx++) {
      items.forEach((item, i) => {
        copies.push({
          ...item,
          key: `${item.id}-${rx}-${ry}`,
          baseX: boxes[i].x * scale + rx * bw,
          baseY: boxes[i].y * scale + ry * bh,
          width: item.w * scale,
          height: item.h * scale,
        });
      });
    }
  }

  return { copies, scale, totalW: bw * repeatX, totalH: bh * repeatY, padX, padY };
}

// intro: when true (and the canvas is ready) play the opening animation.
// onReady: called once the canvas can be shown (WebGL ready, or it failed and
// the plain DOM version is used instead).
export default function InfiniteCanvas({ items, blockWidth, blockHeight, intro = true, onReady }) {
  const [layout, setLayout] = useState(() => computeLayout(items, blockWidth, blockHeight));
  const containerRef = useRef(null);
  const itemEls = useRef([]);
  const layoutRef = useRef(layout);
  // Start shifted, if needed, so the first heading block sits fully on screen:
  // not past the right edge (phones) and not hidden under the fixed navbar.
  const start = useRef(null);
  if (start.current === null) {
    const firstText = layout.copies.find((c) => c.type === 'text');
    // Navbar height (see .nav in styles.css). Measured values, since the nav
    // isn't in the DOM yet during this first render.
    const navBottom = window.innerWidth < MOBILE_BREAKPOINT ? 60 : 82;
    let x = 0;
    let y = 0;
    if (firstText) {
      if (firstText.baseX + firstText.width > window.innerWidth - 16) x = 20 - firstText.baseX;
      if (firstText.baseY < navBottom + 16) y = navBottom + 24 - firstText.baseY;
    }
    start.current = { x, y };
  }
  const target = useRef({ ...start.current });
  const current = useRef({ ...start.current });
  const renderRef = useRef(() => {});
  const glCanvasRef = useRef(null);
  const glRef = useRef(null); // WebGL edge-effect renderer, once loaded
  const speedRef = useRef(0); // px moved in the last frame
  const [glReady, setGlReady] = useState(false);
  const [loaded, setLoaded] = useState(false); // WebGL ready or given up
  const [shown, setShown] = useState(false); // opening animation started
  const playedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const mobile = layout.scale < 1;

  // Draw the current frame: WebGL when it's ready, otherwise move the DOM cards.
  renderRef.current = () => {
    const cx = current.current.x;
    const cy = current.current.y;
    if (glRef.current) {
      glRef.current.render(cx, cy, speedRef.current);
      return;
    }
    const { copies, totalW, totalH, padX, padY } = layoutRef.current;
    for (let i = 0; i < copies.length; i++) {
      const el = itemEls.current[i];
      if (!el) continue;
      const c = copies[i];
      const x = mod(c.baseX + cx + padX, totalW) - padX;
      const y = mod(c.baseY + cy + padY, totalH) - padY;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }
  };

  // Position everything before the first paint and after every layout change.
  useLayoutEffect(() => {
    layoutRef.current = layout;
    itemEls.current.length = layout.copies.length;
    glRef.current?.setLayout(layout);
    renderRef.current();
  }, [layout]);

  // Load Three.js and the edge effect after the page is up (never blocks the
  // first paint). If WebGL isn't available, the DOM version simply stays.
  useEffect(() => {
    let cancelled = false;
    let gl = null;
    (async () => {
      const mod = await import('../webgl/edgeRenderer.js');
      if (cancelled) return;
      if (!mod.webglSupported()) {
        setLoaded(true);
        return;
      }
      // Text is drawn into textures, so the fonts must be ready first.
      try {
        await Promise.all([
          document.fonts.load('700 72px "Google Sans Flex"'),
          document.fonts.load('400 16px "Google Sans Flex"'),
        ]);
      } catch {
        /* fall back to system font */
      }
      if (cancelled) return;
      gl = mod.createEdgeRenderer({
        canvas: glCanvasRef.current,
        mobile,
        requestRender: () => renderRef.current(),
      });
      gl.setLayout(layoutRef.current);
      glRef.current = gl;
      renderRef.current();
      setGlReady(true);
      setLoaded(true);
    })().catch((err) => {
      console.warn('Edge effect unavailable:', err);
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
      glRef.current = null;
      gl?.dispose();
      setGlReady(false);
    };
  }, [mobile]);

  useEffect(() => {
    if (loaded) onReadyRef.current?.();
  }, [loaded]);

  // Opening animation: the artwork fades in while zooming from slightly
  // smaller to full size, with the edge effect kicked up by the movement.
  useEffect(() => {
    if (!intro || !loaded || playedRef.current) return undefined;
    playedRef.current = true;
    setShown(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const DURATION = INTRO_MS;
    const t0 = performance.now();
    let raf = null;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      glRef.current?.setZoom(INTRO_ZOOM + (1 - INTRO_ZOOM) * e);
      speedRef.current = t < 1 ? (1 - e) * INTRO_SPEED : 0;
      renderRef.current();
      // Keep drawing until the edge stretch has relaxed too.
      if (t < 1 || glRef.current?.isSettling()) raf = requestAnimationFrame(step);
      else raf = null;
    };
    glRef.current?.setZoom(INTRO_ZOOM);
    renderRef.current();
    raf = requestAnimationFrame(step);
    return () => {
      // Interrupted (e.g. React StrictMode re-running effects): allow a replay.
      if (raf !== null) playedRef.current = false;
      cancelAnimationFrame(raf);
      glRef.current?.setZoom(1);
    };
  }, [intro, loaded]);

  // Recompute layout on resize / rotation.
  useEffect(() => {
    let frame = null;
    const onResize = () => {
      glRef.current?.resize();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setLayout(computeLayout(items, blockWidth, blockHeight)));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
    };
  }, [items, blockWidth, blockHeight]);

  // Input + animation loop. The loop only runs while something is moving.
  useEffect(() => {
    const el = containerRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = reduceMotion ? 1 : EASE;

    let raf = null;
    let lastTime = 0;
    let dragging = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    let lastMoveTime = 0;
    let velX = 0;
    let velY = 0;

    const tick = (now) => {
      const dt = Math.min(64, now - lastTime);
      lastTime = now;
      const k = 1 - Math.pow(1 - ease, dt / 16.667);
      const cur = current.current;
      const tgt = target.current;
      const mx = (tgt.x - cur.x) * k;
      const my = (tgt.y - cur.y) * k;
      cur.x += mx;
      cur.y += my;
      // Speed in px per 60fps-frame, drives the edge stretch.
      speedRef.current = Math.hypot(mx, my) * (16.667 / Math.max(1, dt));

      const settled = Math.abs(tgt.x - cur.x) < 0.1 && Math.abs(tgt.y - cur.y) < 0.1;
      if (settled && !dragging && !glRef.current?.isSettling()) {
        cur.x = tgt.x;
        cur.y = tgt.y;
        speedRef.current = 0;
        renderRef.current();
        raf = null;
        return;
      }
      renderRef.current();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf === null) {
        lastTime = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.deltaMode === 1) {
        dx *= 16;
        dy *= 16;
      } else if (e.deltaMode === 2) {
        dx *= window.innerWidth;
        dy *= window.innerHeight;
      }
      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }
      target.current.x -= dx;
      target.current.y -= dy;
      start();
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 || dragging) return;
      dragging = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = performance.now();
      velX = 0;
      velY = 0;
      el.setPointerCapture(pointerId);
      el.classList.add('is-dragging');
      start();
    };

    const onPointerMove = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dt = Math.max(1, now - lastMoveTime);
      target.current.x += dx;
      target.current.y += dy;
      // Smoothed velocity in px/ms, used for the flick glide.
      velX = velX * 0.7 + (dx / dt) * 0.3;
      velY = velY * 0.7 + (dy / dt) * 0.3;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = now;
    };

    const onPointerUp = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      el.classList.remove('is-dragging');
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
      // Only glide if the finger was still moving when released.
      if (performance.now() - lastMoveTime < 80) {
        target.current.x += velX * INERTIA_MS;
        target.current.y += velY * INERTIA_MS;
      }
      start();
    };

    const onKeyDown = (e) => {
      const moves = {
        ArrowUp: [0, KEY_STEP],
        ArrowDown: [0, -KEY_STEP],
        ArrowLeft: [KEY_STEP, 0],
        ArrowRight: [-KEY_STEP, 0],
      };
      const m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      target.current.x += m[0];
      target.current.y += m[1];
      start();
    };

    window.addEventListener('wheel', onWheel, { passive: false }); // window, so scrolling over the navbar works too
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`canvas${glReady ? ' is-webgl' : ''}${shown ? ' is-shown' : ''}`}
      tabIndex={0}
      aria-label="Heena design gallery. Drag or scroll to explore."
    >
      {/* WebGL layer (edge effect). Until it's ready, the DOM cards below show. */}
      <canvas ref={glCanvasRef} className="canvas-gl" aria-hidden="true" />
      {layout.copies.map((c, i) =>
        c.type === 'text' ? (
          <section
            key={c.key}
            ref={(node) => (itemEls.current[i] = node)}
            className="canvas-item canvas-text"
            style={{ width: c.width, fontSize: 16 * layout.scale }}
          >
            <h2 className="canvas-text__heading">{c.heading}</h2>
            <p className="canvas-text__meta">
              <span>{c.meta}</span>
              <span className="canvas-text__tag">{c.tag}</span>
            </p>
            <p className="canvas-text__body">{c.body}</p>
          </section>
        ) : (
        <figure
          key={c.key}
          ref={(node) => (itemEls.current[i] = node)}
          className="canvas-item"
          style={{ width: c.width }}
        >
          <span className="canvas-item__index">{String(c.id).padStart(2, '0')}</span>
          <div
            className="canvas-item__media"
            style={{
              height: c.height,
              backgroundImage: c.image ? `url("${c.image.blur}")` : undefined,
            }}
          >
            {c.image && (
              <img
                src={c.image.src}
                srcSet={c.image.srcSet.map((s) => `${s.src} ${s.w}w`).join(', ')}
                sizes={`${Math.round(c.width)}px`}
                alt={`${c.title}, ${c.subtitle}`}
                // Not loading="lazy": the browser can't see that transformed items
                // are on screen, so lazy images wait for the first drag. There are
                // only ~20 unique photos (copies share the URL), so load them all.
                decoding="async"
                draggable="false"
                onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
              />
            )}
          </div>
          <figcaption className="canvas-item__caption">
            <span>{c.title}</span>
            <span className="canvas-item__subtitle">{c.subtitle}</span>
          </figcaption>
        </figure>
        )
      )}
    </div>
  );
}

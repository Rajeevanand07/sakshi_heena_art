import { useEffect, useRef, useState } from 'react';

// Opening loader: a small percentage counter in the middle of the screen.
// It climbs on its own while the gallery gets ready and only reaches 100%
// once `ready` is true. Then it fades out and calls onDone.
//
// Tuning:
const MIN_MS = 900; // shortest time the counter runs, so it never just flashes
const MAX_WAIT_MS = 6000; // give up waiting after this (the gallery works anyway)
const FADE_MS = 450; // matches .loader transition in styles.css

export default function Loader({ ready, onDone }) {
  const [value, setValue] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t0 = performance.now();
    let v = 0;
    let raf = null;
    let timer = null;
    const step = (now) => {
      const elapsed = now - t0;
      const canFinish = (readyRef.current || elapsed > MAX_WAIT_MS) && elapsed > MIN_MS;
      // Creep toward 90% while waiting, then run to 100% once ready.
      const goal = canFinish ? 100 : 90 * (1 - Math.exp(-elapsed / 700));
      v += (goal - v) * 0.12;
      if (canFinish && v > 99.4) v = 100;
      setValue(Math.round(v));
      if (v >= 100) {
        timer = setTimeout(() => {
          setLeaving(true);
          timer = setTimeout(() => doneRef.current?.(), FADE_MS);
        }, 120);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`loader${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <span className="loader__count">{value}%</span>
    </div>
  );
}

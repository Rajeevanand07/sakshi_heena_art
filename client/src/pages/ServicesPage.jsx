import { useEffect, useMemo, useRef, useState } from 'react';
import { SERVICES, BRIDAL_NOTE, SERVICE_PHOTOS } from '../data/services.js';
import photos from '../data/photos.json';
import HScroller from '../components/HScroller.jsx';
import BookingModal from '../components/BookingModal.jsx';
import Rise from '../components/Rise.jsx';

// Services & pricing. Left: the list of services (fills the screen height).
// Right: details of the hovered service and a sideways photo strip.
// Clicking a service (or "Book this service") opens the booking form.
//
// Opening animation: every piece of text rises up from below, one after the
// other (delays below, in ms), then the photo strip slides up (styles.css).
const ROW_START = 120; // first row
const ROW_STEP = 55; // gap between rows
const DETAIL_START = 180; // right-hand details

export default function ServicesPage() {
  const [activeId, setActiveId] = useState(SERVICES[0].id);
  const [bookingId, setBookingId] = useState(null);
  const active = SERVICES.find((s) => s.id === activeId);
  // After the page has opened, hover changes replay the rise with no wait.
  const opened = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => (opened.current = true), 900);
    return () => clearTimeout(t);
  }, []);
  const base = opened.current ? 0 : DETAIL_START;

  const stripPhotos = useMemo(
    () => SERVICE_PHOTOS.map((name) => photos.find((p) => p.name === name)).filter(Boolean),
    [],
  );

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="services">
      <section className="services__list" aria-labelledby="services-title">
        <h1 id="services-title" className="sr-only">
          Services and pricing
        </h1>
        <div className="services__head" aria-hidden="true">
          <Rise>number</Rise>
          <Rise>service</Rise>
          <Rise>price</Rise>
        </div>
        <ol className="services__rows">
          {SERVICES.map((s, i) => {
            const d = ROW_START + i * ROW_STEP;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`services__row${s.id === activeId ? ' is-active' : ''}`}
                  style={{ '--rise-delay': `${d}ms` }}
                  onPointerEnter={() => setActiveId(s.id)}
                  onFocus={() => setActiveId(s.id)}
                  onClick={() => setBookingId(s.id)}
                  aria-haspopup="dialog"
                >
                  <span className="services__num">
                    <Rise delay={d}>{pad(i + 1)}</Rise>
                  </span>
                  <span className="services__name">
                    <Rise delay={d + 30}>{s.name}</Rise>
                  </span>
                  <span className="services__price">
                    <Rise delay={d + 60}>{s.price}</Rise>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="services__note">
          <Rise block delay={ROW_START + SERVICES.length * ROW_STEP}>
            {BRIDAL_NOTE}
          </Rise>
        </p>
      </section>

      <section className="services__detail" aria-live="polite">
        {/* key: hovering another service replays the rise for its details */}
        <div className="services__intro" key={active.id}>
          <div>
            <h2 className="services__title">
              <Rise block delay={base}>
                {active.name}
              </Rise>
            </h2>
            <p className="services__sub">
              <Rise delay={base + 80}>
                {active.price} · {active.kind}
              </Rise>
            </p>
          </div>
          <div className="services__about">
            <p className="services__desc">
              <Rise block delay={base + 120}>
                {active.description}
              </Rise>
            </p>
            <dl className="services__meta">
              {[
                ['Price', active.price],
                ['Ideal for', active.idealFor],
                ['Travel', 'Free within Surrey, BC'],
              ].map(([label, value], i) => (
                <div key={label}>
                  <dt>
                    <Rise delay={base + 180 + i * 50}>{label}</Rise>
                  </dt>
                  <dd>
                    <Rise block delay={base + 210 + i * 50}>
                      {value}
                    </Rise>
                  </dd>
                </div>
              ))}
            </dl>
            <Rise delay={base + 340}>
              <button type="button" className="services__book" onClick={() => setBookingId(active.id)}>
                Book this service
              </button>
            </Rise>
          </div>
        </div>

        <HScroller photos={stripPhotos} label="Mehndi work" />
      </section>

      <BookingModal
        open={bookingId !== null}
        serviceId={bookingId ?? activeId}
        onClose={() => setBookingId(null)}
        onSubmit={(data) => console.info('Booking request (not sent yet):', data)}
      />
    </div>
  );
}

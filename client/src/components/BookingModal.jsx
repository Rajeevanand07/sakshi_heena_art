import { useEffect, useRef, useState } from 'react';
import { SERVICES, BOOKING_POLICY } from '../data/services.js';
import { whatsappUrl } from '../data/social.js';

// Booking form in a native <dialog>: the browser handles focus, Esc to close
// and blocking the page behind it.
//
// On submit, WhatsApp opens with the booking details already typed as a
// message to Sakshi (number in src/data/social.js). The customer presses
// send there. Nothing is stored on a server.

// The WhatsApp message. Edit the wording here.
function bookingMessage(data) {
  const service = SERVICES.find((s) => s.id === data.package);
  const date = data.date
    ? new Date(`${data.date}T12:00:00`).toLocaleDateString('en-CA', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  return [
    'Hi Sakshi! I would like to book mehndi.',
    '',
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : null,
    `Package: ${service ? `${service.name} (${service.price})` : data.package}`,
    `Date of event: ${date}`,
    `Location: ${data.location}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export default function BookingModal({ serviceId, open, onClose, onSubmit }) {
  const ref = useRef(null);
  const [view, setView] = useState('form'); // 'form' | 'policy' | 'done'
  const [pkg, setPkg] = useState(serviceId);
  const [waLink, setWaLink] = useState('');

  // Open/close the native dialog when `open` changes.
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.querySelector('form')?.reset(); // fresh form each time it opens
      setView('form');
      setPkg(serviceId);
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open, serviceId]);

  // Stop the page behind from scrolling while open.
  useEffect(() => {
    document.documentElement.classList.toggle('has-modal', open);
    return () => document.documentElement.classList.remove('has-modal');
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const link = whatsappUrl(bookingMessage(data));
    // Opened right inside the click, so browsers don't block it as a pop-up.
    // On phones this opens the WhatsApp app; on computers WhatsApp Web/desktop.
    window.open(link, '_blank', 'noopener');
    setWaLink(link);
    onSubmit?.(data);
    setView('done');
  };

  // Click on the dark backdrop closes it.
  const onDialogClick = (e) => {
    if (e.target === ref.current) onClose();
  };

  const selected = SERVICES.find((s) => s.id === pkg);

  return (
    <dialog
      ref={ref}
      className="booking"
      aria-labelledby="booking-title"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={onDialogClick}
    >
      <div className="booking__panel">
        <button type="button" className="booking__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {/* Kept mounted (just hidden) so typed values survive a look at the policy */}
        {view !== 'done' && (
          <div hidden={view !== 'form'}>
            <p className="booking__eyebrow">Book an appointment</p>
            <h2 id={view === 'form' ? 'booking-title' : undefined} className="booking__title">
              {selected?.name ?? 'Book mehndi'}
            </h2>
            {selected && (
              <p className="booking__price">
                {selected.price} · {selected.description}
              </p>
            )}

            <form className="booking__form" onSubmit={handleSubmit} noValidate>
              <label className="field">
                <span className="field__label">Your name</span>
                <input name="name" type="text" autoComplete="name" required placeholder="Full name" />
              </label>

              <div className="field-row">
                <label className="field">
                  <span className="field__label">Phone</span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    pattern="[0-9+\(\)\-\s]{7,}"
                    title="Please enter a valid phone number"
                    placeholder="e.g. 604 555 0123"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Email (optional)</span>
                  <input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Package</span>
                <select name="package" required value={pkg} onChange={(e) => setPkg(e.target.value)}>
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.price}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Location</span>
                <input
                  name="location"
                  type="text"
                  autoComplete="street-address"
                  required
                  placeholder="Address or area, e.g. Surrey, BC"
                />
              </label>

              <label className="field">
                <span className="field__label">Date of event</span>
                <input name="date" type="date" required min={todayISO()} />
              </label>

              <button type="submit" className="booking__submit">
                Request booking on WhatsApp
              </button>
            </form>

            <p className="booking__policy-link">
              By booking you agree to our{' '}
              <button type="button" className="link-btn" onClick={() => setView('policy')}>
                booking policy
              </button>
              .
            </p>
          </div>
        )}

        {view === 'policy' && (
          <>
            <p className="booking__eyebrow">Before you book</p>
            <h2 id="booking-title" className="booking__title">
              Booking policy
            </h2>
            <ul className="booking__policy">
              {BOOKING_POLICY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <button type="button" className="booking__submit" onClick={() => setView('form')}>
              Back to booking
            </button>
          </>
        )}

        {view === 'done' && (
          <>
            <p className="booking__eyebrow">Almost done</p>
            <h2 id="booking-title" className="booking__title">
              Send it on WhatsApp
            </h2>
            <p className="booking__text">
              WhatsApp has opened with your booking details. Just press <strong>send</strong> so Sakshi receives
              it. Your booking is confirmed once the $10 deposit is received.
            </p>
            <a className="booking__submit booking__submit--link" href={waLink} target="_blank" rel="noopener noreferrer">
              WhatsApp didn&apos;t open? Tap here
            </a>
            <button type="button" className="link-btn booking__done-close" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}

import { INSTAGRAM_URL, FACEBOOK_URL, whatsappUrl } from '../data/social.js';

// Fixed icon buttons at the bottom centre of every page.
// Instagram and Facebook open the profile in a new tab; WhatsApp opens a chat
// (the WhatsApp app on phones, WhatsApp Web / desktop on computers).

// Brand-coloured logos (Instagram gradient, Facebook blue, WhatsApp green).
const box = { width: 40, height: 40, viewBox: '0 0 24 24', 'aria-hidden': true };
const white = { fill: 'none', stroke: '#fff', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

const InstagramIcon = () => (
  <svg {...box}>
    <defs>
      <radialGradient id="ig-grad" cx="0.28" cy="1.05" r="1.25">
        <stop offset="0" stopColor="#FED576" />
        <stop offset="0.26" stopColor="#F47133" />
        <stop offset="0.61" stopColor="#BC3081" />
        <stop offset="1" stopColor="#4C63D2" />
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="24" height="24" rx="6.5" fill="url(#ig-grad)" />
    <rect x="5.5" y="5.5" width="13" height="13" rx="3.8" {...white} />
    <circle cx="12" cy="12" r="3.1" {...white} />
    <circle cx="15.7" cy="8.3" r="0.8" fill="#fff" />
  </svg>
);

const FacebookIcon = () => (
  <svg {...box}>
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M16.2 15.4l.5-3.4h-3.2V9.8c0-.9.5-1.8 1.9-1.8h1.5V5.1s-1.3-.2-2.6-.2c-2.6 0-4.3 1.6-4.3 4.5V12H7.1v3.4H10V24a12 12 0 0 0 3.5 0v-8.6z"
      fill="#fff"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg {...box}>
    <circle cx="12" cy="12" r="12" fill="#25D366" />
    <g transform="translate(2.4 2.4) scale(0.8)">
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.4 7.6L3.2 20.6l1.5-4.6a8.5 8.5 0 1 1 15.8-4.4z" {...white} strokeWidth={2} />
      <path
        d="M9 8.3c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.7l-.6.7c-.1.1-.1.3 0 .5.6 1.1 1.5 2 2.6 2.6.2.1.4.1.5 0l.7-.6c.2-.2.5-.2.7-.1l1.6.7c.3.1.4.3.4.6v.4c0 .4-.2.7-.5.8-.7.4-1.6.5-2.5.2-2.3-.8-4.1-2.6-4.9-4.9-.3-.9-.2-1.8.2-2.5z"
        fill="#fff"
      />
    </g>
  </svg>
);

const LINKS = [
  { label: 'Instagram', href: INSTAGRAM_URL, Icon: InstagramIcon },
  { label: 'Facebook', href: FACEBOOK_URL, Icon: FacebookIcon },
  { label: 'Chat on WhatsApp', href: whatsappUrl(), Icon: WhatsAppIcon },
];

export default function SocialBar({ stage = 'done' }) {
  const cls = ['social', stage === 'loading' && 'social--wait', stage === 'intro' && 'social--intro']
    .filter(Boolean)
    .join(' ');
  return (
    <nav className={cls} aria-label="Social">
      {LINKS.map(({ label, href, Icon }) => (
        <a key={label} className="social__link" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
          <Icon />
        </a>
      ))}
    </nav>
  );
}

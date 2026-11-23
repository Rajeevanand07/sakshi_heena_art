import Logo from './Logo.jsx';

const LINKS = [
  { to: '/', label: 'gallery area' },
  { to: '/services', label: 'services' },
];

// Fixed on top of the canvas: links on the left, logo on the right.
// The bar itself lets drags pass through to the canvas underneath; only the
// links and logo catch clicks.
// stage: 'loading' hides it, 'intro' fades links then logo in (see App.jsx).
export default function Navbar({ path, onNavigate, stage = 'done' }) {
  const go = (e, to) => {
    // Let ctrl/cmd-click open a new tab as usual.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(to);
  };

  return (
    <header
      className={[
        'nav',
        path === '/services' && 'nav--solid',
        stage === 'loading' && 'nav--wait',
        stage === 'intro' && 'nav--intro',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className="nav__links" aria-label="Main">
        {LINKS.map((l) => (
          <a
            key={l.to}
            href={l.to}
            className="nav__link"
            aria-current={path === l.to ? 'page' : undefined}
            onClick={(e) => go(e, l.to)}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <a href="/" className="nav__brand" aria-label="Sakshi Anand, heena art. Home" onClick={(e) => go(e, '/')}>
        <Logo />
      </a>
    </header>
  );
}

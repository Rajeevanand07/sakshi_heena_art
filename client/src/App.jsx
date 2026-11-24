import { useCallback, useEffect, useState } from 'react';
import GridBackground from './components/GridBackground.jsx';
import Navbar from './components/Navbar.jsx';
import InfiniteCanvas from './components/InfiniteCanvas.jsx';
import MobileGallery from './components/MobileGallery.jsx';
import Loader from './components/Loader.jsx';
import SocialBar from './components/SocialBar.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import { galleryItems, BLOCK_WIDTH, BLOCK_HEIGHT } from './data/galleryItems.js';

// Two pages only, so a tiny router instead of a routing library.
//   /         -> services (home page)
//   /gallery  -> gallery
// Any other address (including the old /services) shows the services page.
export const GALLERY_PATH = '/gallery';

const normalise = (p) => (p === GALLERY_PATH ? GALLERY_PATH : '/');

// Phones get a simple up/down scrolling gallery instead of the infinite
// canvas (no WebGL edge effect, nothing extra to download).
const PHONE_QUERY = '(max-width: 767px)';
function useIsPhone() {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = () => setPhone(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return phone;
}

export default function App() {
  const [path, setPath] = useState(() => normalise(window.location.pathname));
  const phone = useIsPhone();
  // Opening sequence, only when the site is first opened on the gallery:
  // 'loading' (counter) -> 'intro' (artwork appears, nav fades in) -> 'done'.
  const [stage, setStage] = useState(() => (normalise(window.location.pathname) === GALLERY_PATH ? 'loading' : 'done'));
  const [galleryReady, setGalleryReady] = useState(false);

  // Old or unknown addresses (e.g. /services) become the clean home address.
  useEffect(() => {
    if (window.location.pathname !== path) window.history.replaceState(null, '', path);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPop = () => setPath(normalise(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to) => {
    if (to === path) return;
    window.history.pushState(null, '', to);
    setPath(to);
  };

  const isGallery = path === GALLERY_PATH;

  useEffect(() => {
    document.title = isGallery ? 'Gallery | Sakshi Anand Heena Art' : 'Sakshi Anand | Heena Art';
  }, [isGallery]);

  // After the intro has played, the nav no longer needs its intro classes.
  useEffect(() => {
    if (stage !== 'intro') return undefined;
    const t = setTimeout(() => setStage('done'), 2000);
    return () => clearTimeout(t);
  }, [stage]);

  const onGalleryReady = useCallback(() => setGalleryReady(true), []);

  let page;
  if (!isGallery) page = <ServicesPage key="services" />;
  else if (phone) page = <MobileGallery items={galleryItems} intro={stage !== 'loading'} onReady={onGalleryReady} />;
  else
    page = (
      <InfiniteCanvas
        items={galleryItems}
        blockWidth={BLOCK_WIDTH}
        blockHeight={BLOCK_HEIGHT}
        intro={stage !== 'loading'}
        onReady={onGalleryReady}
      />
    );

  return (
    <main className="app">
      {isGallery && !phone && <GridBackground />}
      <Navbar path={path} solid={!isGallery || phone} onNavigate={navigate} stage={stage} />
      {page}
      <SocialBar stage={stage} />
      {stage === 'loading' && <Loader ready={galleryReady} onDone={() => setStage('intro')} />}
    </main>
  );
}

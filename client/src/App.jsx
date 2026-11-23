import { useCallback, useEffect, useState } from 'react';
import GridBackground from './components/GridBackground.jsx';
import Navbar from './components/Navbar.jsx';
import InfiniteCanvas from './components/InfiniteCanvas.jsx';
import Loader from './components/Loader.jsx';
import SocialBar from './components/SocialBar.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import { galleryItems, BLOCK_WIDTH, BLOCK_HEIGHT } from './data/galleryItems.js';

// Two pages only, so a tiny router instead of a routing library.
export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  // Opening sequence, only when the site is first opened on the gallery:
  // 'loading' (counter) -> 'intro' (artwork zooms in, nav fades in) -> 'done'.
  const [stage, setStage] = useState(() => (window.location.pathname === '/services' ? 'done' : 'loading'));
  const [galleryReady, setGalleryReady] = useState(false);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to) => {
    if (to === path) return;
    window.history.pushState(null, '', to);
    setPath(to);
  };

  const isServices = path === '/services';

  useEffect(() => {
    document.title = isServices ? 'Services | Sakshi Anand Heena Art' : 'Sakshi Anand | Heena Art';
  }, [isServices]);

  // After the intro has played, the nav no longer needs its intro classes.
  useEffect(() => {
    if (stage !== 'intro') return undefined;
    const t = setTimeout(() => setStage('done'), 2000);
    return () => clearTimeout(t);
  }, [stage]);

  const onGalleryReady = useCallback(() => setGalleryReady(true), []);

  return (
    <main className="app">
      {!isServices && <GridBackground />}
      <Navbar path={isServices ? '/services' : '/'} onNavigate={navigate} stage={stage} />
      {isServices ? (
        <ServicesPage key="services" />
      ) : (
        <InfiniteCanvas
          items={galleryItems}
          blockWidth={BLOCK_WIDTH}
          blockHeight={BLOCK_HEIGHT}
          intro={stage !== 'loading'}
          onReady={onGalleryReady}
        />
      )}
      <SocialBar stage={stage} />
      {stage === 'loading' && <Loader ready={galleryReady} onDone={() => setStage('intro')} />}
    </main>
  );
}

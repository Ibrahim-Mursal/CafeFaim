import { useLang } from './lang.jsx';
import { useScrollReveal } from './hooks/useScrollReveal.js';
import { usePageReady } from './hooks/usePageReady.js';
import { Nav } from './components/Nav.jsx';
import { Hero } from './components/Hero.jsx';
import { Ticker } from './components/Ticker.jsx';
import { Concept } from './components/Concept.jsx';
import { Menu } from './components/Menu.jsx';
import { Cakes } from './components/Cakes.jsx';
import { Gallery } from './components/Gallery.jsx';
import { Visit } from './components/Visit.jsx';
import { Footer } from './components/Footer.jsx';

export default function App() {
  const { t } = useLang();
  usePageReady();
  useScrollReveal();

  return (
    <>
      <a className="skip" href="#main">
        {t('Naar hoofdinhoud', 'Skip to content')}
      </a>

      <Nav />

      <main id="main">
        <Hero />
        <Ticker />
        <Concept />
        <Menu />
        <Cakes />
        <Gallery />
        <Visit />
      </main>

      <Footer />
    </>
  );
}

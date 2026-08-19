import { useState } from 'react';
import { useLang } from '../lang.jsx';
import { useContent } from '../content/ContentContext.jsx';
import { INSTAGRAM } from '../data/site.js';

function Tile({ photo, duplicate }) {
  const { t } = useLang();
  return (
    <figure className="marq__i" aria-hidden={duplicate || undefined}>
      {/* Sized by .marq__i img's aspect-ratio, not by attributes — see Cakes.jsx */}
      <img
        src={photo.src}
        alt={duplicate ? '' : photo.alt}
        loading="lazy"
        draggable="false"
      />
      <figcaption>{t(photo.caption)}</figcaption>
    </figure>
  );
}

/*
 * "In beeld" — one continuous strip drifting right-to-left, echoing the ticker
 * above it.
 *
 * The photo list is rendered twice and the track travels exactly -50%, so the
 * second copy lands where the first started and the loop has no visible seam.
 * The duplicate is aria-hidden and alt-empty: it is the same eight photos, and
 * a screen reader should hear them once.
 *
 * Motion is opt-out on three levels, because auto-moving content that runs
 * longer than five seconds needs a real pause control (WCAG 2.2.2), not just a
 * hover state: the explicit button below the strip, hover/focus-within, and
 * prefers-reduced-motion. Whenever the drift is off, CSS turns the strip into a
 * normal horizontal scroller — which is also what touch devices always get, so
 * a swipe moves the photos instead of fighting the animation.
 */
export function Gallery() {
  const { t } = useLang();
  const { gallery: galleryPhotos } = useContent();
  const [paused, setPaused] = useState(false);

  return (
    <section className="sec sec--beeld" id="beeld">
      <div className="wrap">
        <p className="kicker center">{t('In beeld', 'In pictures')}</p>
        <h2 className="center display">{t('Zo ziet Faim eruit', 'This is Faim')}</h2>
        <p className="lead center">
          {t('Van de eerste matcha tot de laatste kruimel.', 'From the first matcha to the last crumb.')}
        </p>
      </div>

      <div className={`marq${paused ? ' is-paused' : ''}`}>
        <div className="marq__track">
          {galleryPhotos.map((photo) => (
            <Tile key={photo.id} photo={photo} />
          ))}
          {galleryPhotos.map((photo) => (
            <Tile key={`dup-${photo.id}`} photo={photo} duplicate />
          ))}
        </div>
      </div>

      <div className="wrap center">
        <button
          className="marq__toggle"
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-pressed={paused}
        >
          {paused ? t('Afspelen', 'Play') : t('Pauzeer', 'Pause')}
        </button>

        <p className="menu__foot">
          <a href={INSTAGRAM} target="_blank" rel="noopener">
            {t('Meer op Instagram → @cafefaim', 'More on Instagram → @cafefaim')}
          </a>
        </p>
      </div>
    </section>
  );
}

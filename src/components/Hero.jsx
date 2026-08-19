import { useEffect, useMemo, useRef } from 'react';
import { useLang } from '../lang.jsx';
import { useTypewriter } from '../hooks/useTypewriter.js';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js';
import { WHATSAPP } from '../data/site.js';
import { useContent } from '../content/ContentContext.jsx';

const WORDS = [
  { nl: 'Zoet', en: 'Sweet' },
  { nl: 'Vers', en: 'Fresh' },
  { nl: 'Gezellig', en: 'Cozy' },
  { nl: 'Halal', en: 'Halal' },
];

export function Hero() {
  const { t } = useLang();
  const { heroVideo } = useContent();
  const reduce = usePrefersReducedMotion();
  const video = useRef(null);

  const words = useMemo(() => WORDS.map((w) => t(w)), [t]);
  const typed = useTypewriter(words);

  // autoplay has already fired by the time this runs, so pause rather than
  // block it outright — respects prefers-reduced-motion without needing the
  // video element itself to be conditional.
  useEffect(() => {
    if (reduce) video.current?.pause();
  }, [reduce]);

  return (
    <section className="hero" id="top">
      <video
        // Keyed on the source so swapping the video in the dashboard actually
        // reloads it — changing a <source> src alone does not.
        key={heroVideo}
        ref={video}
        className="hero__bg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      <div className="hero__scrim" aria-hidden="true" />

      <div className="wrap hero__inner">
        <p className="eyebrow">Café · Lunch · Patisserie</p>

        <h1 className="hero__title">
          <span className="hero__type t-green" aria-hidden="true">
            <span className="hero__type-text">{typed}</span>
            <span className="hero__type-cursor" />
          </span>
          <span className="sr-only">
            {t('Zoet, gezellig, halal, vers,', 'Sweet, cozy, halal, fresh,')}
          </span>
          <br />
          <span className="t-pink">We cake you happy!</span>
        </h1>

        <p className="hero__sub">
          {t(
            'Coffee, matcha, lunch en patisserie in hartje Waalwijk. Elke dag vers gemaakt — en 100% halal.',
            'Coffee, matcha, lunch and patisserie in the heart of Waalwijk. Freshly made every day — and 100% halal.'
          )}
        </p>

        <div className="hero__cta">
          <a className="btn btn--pink" href="#menu">
            {t('Bekijk het menu', 'See the menu')}
          </a>
          <a className="btn btn--ghost" href={WHATSAPP} target="_blank" rel="noopener">
            {t('Taart op maat →', 'Custom cake →')}
          </a>
        </div>
      </div>
    </section>
  );
}

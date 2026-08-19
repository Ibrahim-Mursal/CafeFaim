import { useLang } from '../lang.jsx';
import { useContent } from '../content/ContentContext.jsx';
import { WHATSAPP } from '../data/site.js';

export function Cakes() {
  const { t } = useLang();
  const { cakes } = useContent();

  return (
    <section className="sec sec--pink" id="taarten">
      <div className="wrap">
        <p className="kicker center">Sweets Paradise</p>
        <h2 className="center display">{t('Taarten op maat', 'Custom cakes')}</h2>
        <p className="lead center">
          {t(
            'Van bruiloft tot babyshower, van verjaardag tot sweet table. Vertel ons je idee via WhatsApp en we maken het.',
            "From weddings to baby showers, birthdays to sweet tables. Tell us your idea on WhatsApp and we'll make it."
          )}
        </p>

        <div className="cakes">
          {cakes.map((cake) => (
            <figure className="cake" key={cake.id}>
              {/* No width/height attributes: .cake img fixes the box with
                  aspect-ratio, and an intrinsic height attribute would beat
                  that rule and let the hover zoom spill over the caption.
                  Uploaded photos have no known dimensions either. */}
              <img src={cake.src} alt={cake.alt} loading="lazy" />
              <figcaption>
                <h3>{t(cake.title)}</h3>
                <p>{t(cake.blurb)}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="center">
          <a
            className="btn btn--pink btn--lg"
            href={WHATSAPP}
            target="_blank"
            rel="noopener"
          >
            {t('Bestel via WhatsApp', 'Order via WhatsApp')}
          </a>
          <p className="micro">
            {t(
              'Ook voor catering. Bekijk ons werk op Instagram.',
              'Catering too. See our work on Instagram.'
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

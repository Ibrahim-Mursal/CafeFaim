import { useLang } from '../lang.jsx';
import { footerHours, INSTAGRAM, MAPS, WHATSAPP } from '../data/site.js';

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="foot">
      <div className="checker" aria-hidden="true" />
      <div className="wrap foot__inner">
        <div className="foot__brand">
          <span className="brand brand--light">
            <span className="brand__faim">Faim</span>
            <span className="brand__cafe">café</span>
          </span>
          <p className="foot__tag">We cake you happy!</p>
          <p className="foot__blurb">
            {t(
              'Café · Lunch · Patisserie in Waalwijk. Elke dag vers, 100% halal.',
              'Café · Lunch · Patisserie in Waalwijk. Fresh every day, 100% halal.'
            )}
          </p>
        </div>

        <div className="foot__col">
          <h4>{t('Adres', 'Address')}</h4>
          <p>
            Stationsstraat 107
            <br />
            5141 GD Waalwijk
          </p>
          <a className="foot__link" href={MAPS} target="_blank" rel="noopener">
            {t('Route →', 'Directions →')}
          </a>
        </div>

        <div className="foot__col">
          <h4>{t('Openingstijden', 'Opening hours')}</h4>
          <ul className="foot__hours">
            {footerHours.map((row, i) => (
              <li key={i}>
                <span>{t(row.day)}</span>
                <em>{t(row.hours)}</em>
              </li>
            ))}
          </ul>
        </div>

        <div className="foot__col">
          <h4>{t('Volg & bestel', 'Follow & order')}</h4>
          <a className="foot__link" href={INSTAGRAM} target="_blank" rel="noopener">
            Instagram
          </a>
          <a className="foot__link" href={WHATSAPP} target="_blank" rel="noopener">
            WhatsApp
          </a>
        </div>
      </div>
      <p className="foot__copy">
        © {new Date().getFullYear()} Café Faim · Café – Lunch – Patisserie
      </p>
    </footer>
  );
}

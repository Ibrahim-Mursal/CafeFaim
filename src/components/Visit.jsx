import { useLang } from '../lang.jsx';
import { openingHours, INSTAGRAM, MAP_EMBED, WHATSAPP } from '../data/site.js';

export function Visit() {
  const { t } = useLang();

  return (
    <section className="sec sec--cream" id="bezoek">
      <div className="wrap visit">
        <div>
          <p className="kicker">{t('Bezoek ons', 'Visit us')}</p>
          <h2>Stationsstraat 107</h2>
          <p className="visit__addr">
            5141 GD Waalwijk
            <br />
            <span>{t('Nederland', 'Netherlands')}</span>
          </p>

          <h3 className="visit__h3">{t('Openingstijden', 'Opening hours')}</h3>
          <table className="hours">
            <tbody>
              {openingHours.map((row, i) => (
                <tr key={i}>
                  <th>{t(row.day)}</th>
                  <td className={row.closed ? 'closed' : undefined}>{t(row.hours)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="visit__h3">Contact</h3>
          <p className="visit__contact">
            <a href={WHATSAPP} target="_blank" rel="noopener">
              WhatsApp
            </a>{' '}
            ·{' '}
            <a href={INSTAGRAM} target="_blank" rel="noopener">
              @cafefaim
            </a>
          </p>
        </div>

        <div className="map">
          <iframe
            title={t(
              'Kaart — Café Faim, Stationsstraat 107 Waalwijk',
              'Map — Café Faim, Stationsstraat 107 Waalwijk'
            )}
            src={MAP_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

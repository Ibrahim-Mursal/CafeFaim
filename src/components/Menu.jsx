import { useLang } from '../lang.jsx';
import { useContent } from '../content/ContentContext.jsx';

function Row({ item }) {
  const { t } = useLang();
  return (
    <li>
      <p className="mrow">
        <span className="mn">{t(item.name)}</span>
        <span className="mp">
          {item.from && (
            <>
              <em className="mfrom">{t(item.from)}</em>
              {'\u00a0'}
            </>
          )}
          {item.price}
        </span>
      </p>
      {item.desc && <p className="md">{t(item.desc)}</p>}
    </li>
  );
}

// Rows without a description sit much closer together on the printed card;
// deriving that from the data keeps a "tight" flag out of every entry.
function ItemList({ items }) {
  const tight = items.every((item) => !item.desc);
  return (
    <ul className={`mlist${tight ? ' mlist--tight' : ''}`}>
      {items.map((item, i) => (
        <Row key={i} item={item} />
      ))}
    </ul>
  );
}

function Group({ section }) {
  const { t } = useLang();
  return (
    <section className="mgrp">
      <h4 className={`mgrp__h${section.sub ? ' mgrp__h--sub' : ''}`}>{t(section.heading)}</h4>
      <ItemList items={section.items} />
    </section>
  );
}

function Section({ section }) {
  const { t } = useLang();

  switch (section.kind) {
    case 'group':
      return <Group section={section} />;

    case 'box':
      return (
        <section className="mbox">
          <h4 className="mgrp__h">{t(section.heading)}</h4>
          <ItemList items={section.items} />
        </section>
      );

    case 'boxList':
      return (
        <section className="mbox">
          <h4 className="mgrp__h">{t(section.heading)}</h4>
          <p className="mbox__lead">{t(section.lead)}</p>
          <ul className="mbox__list">
            {section.list.map((entry, i) => (
              <li key={i}>{t(entry)}</li>
            ))}
          </ul>
          <p className="mbox__note">{t(section.note)}</p>
        </section>
      );

    case 'feature':
      return (
        <div className="mfeature">
          <span className="mfeature__badge">{t(section.badge)}</span>
          {section.groups.map((group, i) => (
            <Group key={i} section={group} />
          ))}
        </div>
      );

    case 'till':
      return <p className="mtill">{t(section.text)}</p>;

    default:
      return null;
  }
}

export function Menu() {
  const { t } = useLang();
  const { menuCards } = useContent();

  return (
    <section className="sec sec--cream" id="menu">
      <div className="wrap">
        <p className="kicker center">{t('Menukaart', 'Menu')}</p>
        <h2 className="center display">{t('Wat we serveren', 'What we serve')}</h2>

        {menuCards.map((card, i) => (
          <article className="mcard" key={card.id ?? i}>
            <h3 className="mcard__t">{t(card.title)}</h3>
            <div className="mcard__cols">
              {card.columns.map((column, c) => (
                <div className="mcol" key={c}>
                  {column.map((section, s) => (
                    <Section key={s} section={section} />
                  ))}
                </div>
              ))}
            </div>
          </article>
        ))}

        <p className="menu__foot">
          {t(
            'Menu zoals in de zaak. Vraag ons gerust naar allergenen.',
            'Menu as shown in store. Feel free to ask us about allergens.'
          )}
        </p>
      </div>
    </section>
  );
}

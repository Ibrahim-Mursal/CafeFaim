import { useLang } from '../lang.jsx';
import { useContent } from '../content/ContentContext.jsx';

export function Concept() {
  const { t } = useLang();
  const { conceptBlock, conceptPills } = useContent();

  return (
    <section className="sec sec--cream" id="concept">
      <div className="wrap concept">
        <div className="concept__text">
          <p className="kicker">{t(conceptBlock.kicker)}</p>
          <h2>{t(conceptBlock.heading)}</h2>
          <p>{t(conceptBlock.body1)}</p>
          <p>{t(conceptBlock.body2)}</p>
        </div>

        <ul className="pills">
          {conceptPills.map((pill, i) => (
            <li key={pill.id ?? i}>
              <strong>{t(pill.strong)}</strong>
              <span>{t(pill.label)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

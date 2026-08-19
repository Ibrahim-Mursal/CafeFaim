import { useLang } from '../lang.jsx';

export function Ticker() {
  const { t } = useLang();
  const line = `Coffee ✦ Matcha ✦ Lunch ✦ Pastries ✦ 100% Halal ✦ ${t(
    'Vers gemaakt',
    'Freshly made'
  )} ✦ `;
  const strip = line.repeat(2);

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        <span>{strip}</span>
        <span>{strip}</span>
      </div>
    </div>
  );
}

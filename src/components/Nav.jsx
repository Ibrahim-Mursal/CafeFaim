import { useEffect, useState } from 'react';
import { useLang } from '../lang.jsx';
import { useStuckNav } from '../hooks/useStuckNav.js';
import { navLinks, WHATSAPP } from '../data/site.js';

export function Nav() {
  const { t, lang, toggle } = useLang();
  const stuck = useStuckNav();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        document.getElementById('burger')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`nav${stuck ? ' stuck' : ''}${open ? ' open' : ''}`} id="nav">
      <div className="wrap nav__inner">
        <a className="brand" href="#top" aria-label="Café Faim">
          <span className="brand__faim">Faim</span>
          <span className="brand__cafe">café</span>
        </a>

        <nav className="nav__links" aria-label={t('Hoofdmenu', 'Main menu')}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {t(link.label)}
            </a>
          ))}
          <a
            className="btn btn--pink btn--sm nav__cta--mobile"
            href={WHATSAPP}
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
          >
            {t('Bestel een taart', 'Order a cake')}
          </a>
        </nav>

        <div className="nav__actions">
          <button
            className="langbtn"
            id="langbtn"
            type="button"
            onClick={toggle}
            aria-label={lang === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}
          >
            {lang === 'nl' ? 'EN' : 'NL'}
          </button>
          <a className="btn btn--pink btn--sm" href={WHATSAPP} target="_blank" rel="noopener">
            {t('Bestel een taart', 'Order a cake')}
          </a>
        </div>

        <button
          className="burger"
          id="burger"
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

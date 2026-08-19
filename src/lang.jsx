import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion.js';

const STORE = 'faim-lang';
// Half of the .lang-dip keyframe in style.css: the text is swapped at the
// midpoint of the dip, while it is invisible.
const SWAP_FADE_MS = 130;

const TITLES = {
  nl: 'Café Faim — Café · Lunch · Patisserie in Waalwijk',
  en: 'Café Faim — Café · Lunch · Patisserie in Waalwijk, NL',
};

const LangContext = createContext(null);

function storedLang() {
  try {
    return localStorage.getItem(STORE) === 'en' ? 'en' : 'nl';
  } catch {
    return 'nl';
  }
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(storedLang);
  const reduce = usePrefersReducedMotion();
  const timer = useRef(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = TITLES[lang];
  }, [lang]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // A whole-page text swap landing instantly reads as a flicker, not a
  // deliberate action. Dip the translated text to 0, swap while it is
  // invisible, recover — one legible "the language changed" moment instead of
  // dozens of silent jumps. The dip itself lives in CSS (html.lang-swap) so it
  // costs no re-render and never fights a button's own hover transition.
  const toggle = useCallback(() => {
    const next = lang === 'nl' ? 'en' : 'nl';
    try {
      localStorage.setItem(STORE, next);
    } catch {
      /* private mode — the toggle still works for this session */
    }

    if (reduce) {
      setLang(next);
      return;
    }

    clearTimeout(timer.current);
    document.documentElement.classList.add('lang-swap');
    timer.current = setTimeout(() => {
      setLang(next);
      timer.current = setTimeout(
        () => document.documentElement.classList.remove('lang-swap'),
        SWAP_FADE_MS
      );
    }, SWAP_FADE_MS);
  }, [lang, reduce]);

  return <LangContext.Provider value={{ lang, toggle }}>{children}</LangContext.Provider>;
}

/*
 * t() replaces the old data-nl / data-en attribute pairs and accepts both
 * shapes so copy can stay inline where it is written once, and live in a data
 * file where it is reused:
 *   t('Over ons', 'About')            -> inline pair
 *   t({ nl: 'Koffie', en: 'Coffee' }) -> from src/data
 *   t('Espresso')                     -> same in both languages
 */
export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');

  const { lang, toggle } = ctx;
  const t = useCallback(
    (nl, en) => {
      if (nl && typeof nl === 'object') return nl[lang] ?? nl.nl;
      return lang === 'en' && en !== undefined ? en : nl;
    },
    [lang]
  );

  return { lang, toggle, t };
}

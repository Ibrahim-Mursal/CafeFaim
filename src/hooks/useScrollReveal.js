import { useEffect } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

// The .rv / .rv.in pair (and its :nth-child stagger) is pure CSS, so this stays
// a single mount-time sweep over the rendered tree rather than a ref on every
// element — the stagger depends on real sibling order, which only the DOM knows.
const SELECTOR =
  '.concept__text, .pills li, .mcard, .cake, .visit > div, .map, .hero__inner > *';

export function useScrollReveal() {
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const targets = document.querySelectorAll(SELECTOR);

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('rv', 'in'));
      return;
    }

    targets.forEach((t) => t.classList.add('rv'));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [reduce]);
}

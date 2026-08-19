import { useEffect } from 'react';

// Fades the page in once webfonts have settled, so Fredoka/DM Sans never flash
// as fallback serif first. The timeout is a hard floor — a font that never
// resolves must not leave the site invisible.
export function usePageReady() {
  useEffect(() => {
    const ready = () => document.body.classList.add('ready');
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ready);
      const id = setTimeout(ready, 900);
      return () => clearTimeout(id);
    }
    ready();
  }, []);
}

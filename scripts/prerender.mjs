/*
 * Injects the prerendered markup into dist/index.html.
 *
 * Deliberately non-fatal: if anything here fails the build still ships a
 * working client-rendered site, exactly as before. A broken deploy would be a
 * far worse outcome than a page that renders a moment later, so this warns and
 * exits 0 rather than failing CI.
 *
 * The client uses createRoot, not hydrateRoot, so React discards this markup
 * and renders fresh on load. That trades a little duplicated work for immunity
 * to hydration mismatches — which, in a page with a typewriter animation and a
 * language read from localStorage, would otherwise be a constant source of bugs.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PAGE = 'dist/index.html';
const MOUNT = '<div id="root"></div>';

try {
  if (!existsSync(PAGE)) throw new Error(`${PAGE} not found — run the client build first`);

  const { render } = await import('../dist-ssr/entry-server.js');
  const html = render();

  if (!html || html.length < 500) {
    throw new Error(`rendered markup looks empty (${html?.length ?? 0} chars)`);
  }

  const page = readFileSync(PAGE, 'utf8');
  if (!page.includes(MOUNT)) throw new Error('mount point not found in dist/index.html');

  writeFileSync(PAGE, page.replace(MOUNT, `<div id="root">${html}</div>`), 'utf8');

  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`prerendered ${(html.length / 1024).toFixed(1)} kB of markup, ~${words} words`);
} catch (err) {
  console.warn(`prerender skipped: ${err.message}`);
  console.warn('the site will render client-side, as it did before');
}

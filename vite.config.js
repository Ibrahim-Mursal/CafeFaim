import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { buildHeadTags, buildRobots, buildSitemap, siteUrlFrom } from './scripts/seo.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// base:'./' keeps every emitted URL relative, so the built site works from a
// domain root or a subfolder without a rebuild. Assets under public/ keep the
// exact paths they had on the old static site (assets/gallery/...).
/*
 * Generates the SEO head, robots.txt and sitemap.xml at build time from the
 * content in src/data, so the structured data cannot drift from the menu the
 * site renders. Only the public page gets them — the dashboard stays noindex.
 */
function seoPlugin(siteUrl) {
  return {
    name: 'faim-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.path.endsWith('index.html')) return html;
        return html.replace('<!--SEO-->', buildHeadTags(siteUrl));
      },
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(siteUrl) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(siteUrl) });
    },
    // Dev server needs them too, so they can be checked before deploying.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') return res.end(buildRobots(siteUrl));
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml');
          return res.end(buildSitemap(siteUrl));
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), seoPlugin(siteUrlFrom(loadEnv(mode, process.cwd(), '')))],
  build: {
    outDir: 'dist',
    assetsDir: 'assets/build',
    // Two entry points, so the dashboard is a plain static file that works on
    // any host without an SPA-rewrite rule — and so the public page never
    // downloads a byte of the dashboard or the Supabase SDK. The entry is named
    // fata rather than admin so the emitted chunks are not obviously the
    // dashboard either.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        fata: resolve(__dirname, 'fata.html'),
      },
    },
  },
}));

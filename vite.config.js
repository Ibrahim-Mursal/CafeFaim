import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

// base:'./' keeps every emitted URL relative, so the built site works from a
// domain root or a subfolder without a rebuild. Assets under public/ keep the
// exact paths they had on the old static site (assets/gallery/...).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets/build',
    // Two entry points, so /admin.html is a plain static file that works on
    // any host without an SPA-rewrite rule — and so the public page never
    // downloads a byte of the dashboard or the Supabase SDK.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Separate from the main config: the SSR build has one JS entry, while the
// client build has two HTML entries, and the two input shapes cannot share
// a config cleanly.
export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
  },
});

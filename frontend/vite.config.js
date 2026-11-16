import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // MapLibre spawns its tile worker via an ESM URL; pre-bundling rewrites it
  // and the worker 404s in dev. Let Vite serve the package natively.
  optimizeDeps: {
    exclude: ['maplibre-gl']
  },
  worker: {
    format: 'es'
  },
  server: {
    port: 5173,
    host: true
  }
});

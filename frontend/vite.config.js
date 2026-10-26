import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // In development the API is proxied, so the frontend can call `/api` without CORS setup.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // three.js alone is ~550 kB minified; it lives in its own lazily-loaded chunk.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'node',
  },
});

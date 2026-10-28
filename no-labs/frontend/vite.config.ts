import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const target = `http://localhost:${process.env.PORT || 3333}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.DEV_PORT || 5333),
    strictPort: true,
    proxy: {
      '/v1': { target, changeOrigin: true, timeout: 0, proxyTimeout: 0 },
      '/files': { target, changeOrigin: true },
    },
  },
});

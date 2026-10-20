import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});

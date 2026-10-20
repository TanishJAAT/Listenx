import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    allowedHosts: [
      'listenx.onrender.com',
      '.onrender.com'
    ],
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4173,
    allowedHosts: [
      'listenx.onrender.com',
      '.onrender.com'
    ]
  }
});

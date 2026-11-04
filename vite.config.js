import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Anfragen an /api gehen im Dev-Betrieb an Express weiter.
    // Für den Browser liegt alles unter derselben Adresse, deshalb braucht es kein CORS.
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});

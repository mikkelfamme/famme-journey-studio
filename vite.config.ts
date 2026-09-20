import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['journey-studio-js.svg', 'journey-studio-js-192.png', 'journey-studio-js-512.png', 'journey-studio-js-maskable-512.png'],
      manifest: {
        id: './',
        name: 'Journey Studio',
        short_name: 'Journey Studio',
        description: 'Visual customer journey architecture, tracking and performance mapping.',
        theme_color: '#111827',
        background_color: '#f6f7f9',
        display: 'standalone',
        scope: './',
        start_url: './',
        icons: [
          { src: 'journey-studio-js-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'journey-studio-js-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'journey-studio-js-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'journey-studio-js.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  base: './'
});

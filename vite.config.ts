import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifestFilename: 'journey-studio-v2.webmanifest',
      includeAssets: ['journey-studio-app-v2.svg', 'journey-studio-app-v2-192.png', 'journey-studio-app-v2-512.png', 'journey-studio-app-v2-maskable-512.png', 'journey-studio-app-v2.ico'],
      manifest: {
        id: './?app=journey-studio',
        name: 'Journey Studio',
        short_name: 'Journey Studio',
        description: 'Visual customer journey architecture, tracking and performance mapping.',
        theme_color: '#111827',
        background_color: '#f6f7f9',
        display: 'standalone',
        scope: './',
        start_url: './',
        icons: [
          { src: 'journey-studio-app-v2-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'journey-studio-app-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'journey-studio-app-v2-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'journey-studio-app-v2.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
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

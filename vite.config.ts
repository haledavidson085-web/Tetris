import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative asset URLs let the same build run at a GitHub Pages project path.
  base: './',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Tetris — Find Your Flow',
        short_name: 'Tetris',
        description: 'A calm, polished falling-block game with profiles, high scores, and custom board themes.',
        theme_color: '#f5f4ee',
        background_color: '#f5f4ee',
        display: 'standalone',
        orientation: 'any',
        categories: ['games', 'entertainment'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,ico}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});

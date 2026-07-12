import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Claude Code's preview (launch.json `autoPort`) picks a free port and hands it
// to the dev server via the PORT env var — but Vite ignores PORT by default and
// binds 5173, so the harness probes the wrong port and the tab never loads.
// Honour PORT when set; fall back to Vite's default for a plain `npm run dev`.
const port = process.env.PORT ? Number(process.env.PORT) : undefined;
const underPreview = port !== undefined;

export default defineConfig({
  base: './',
  server: {
    port,
    // Bind exactly the harness-assigned port (fail loudly on a clash) rather
    // than silently hopping to the next free one, which would desync again.
    strictPort: underPreview,
    // Vite's default `localhost` host binds a single resolved address — on this
    // Windows box that's IPv6 `::1` only, so the preview's embedded Chromium,
    // which reaches `localhost` over IPv4 `127.0.0.1`, gets ERR_FAILED. Bind
    // the unspecified address (dual-stack) under the preview so both loopbacks
    // are served. Left untouched for a plain `npm run dev`.
    host: underPreview ? true : undefined,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Mathle FR',
        short_name: 'Mathle',
        lang: 'fr',
        description: 'Mathle : marque un max de points de calcul mental en temps limité.',
        start_url: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#eef2ff',
        theme_color: '#4f46e5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,bin,png,svg}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Purge previously precached assets (old icons included) as soon as a
        // new service worker activates, instead of leaving them in the cache
        // storage indefinitely.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});

# Mathle PWA

French math challenge game: score as many points as possible in a timed round,
then challenge a friend with a shareable link. Maths sibling of the Boggle PWA,
built on the same stack.

> **Status: scaffold.** The game concept is not final yet. `src/game/` holds a
> **placeholder** (mental arithmetic) marked with `PLACEHOLDER` banners. When
> the real concept is defined, replace that logic; the app shell (router, share,
> history, screens) is concept-agnostic.

## Stack

- **Language**: TypeScript (strict), ES modules. No UI framework — direct DOM via the `el`/`clear` helpers in `src/ui/dom.ts`.
- **Build/dev**: Vite 6.
- **PWA**: `vite-plugin-pwa` (Workbox service worker, `autoUpdate`), offline-capable.
- **Tests**: Vitest + jsdom.
- **Challenge**: a challenge is a single integer seed (+ optional score to beat)
  encoded in the `c` URL param (`src/share/codec.ts`). The seed deterministically
  derives the whole round, so a shared link is perfectly reproducible with no
  backend.
- **Icons**: `public/icon.svg` is the source of truth; the PNG icons are derived
  and committed. Regenerate with `npm run build:icons` (tsx + sharp).
- **Game history**: past games logged to `localStorage` (`src/history/store.ts`),
  browsable in-app (`src/ui/history.ts`); no backend, capped at 200 entries.
- **Hosting**: Netlify static site, no backend.

## Rules

Placeholder rules live in `docs/RULES.md` and are readable in-app on a dedicated
screen (`src/ui/rules.ts`) reachable via the "?" help button.

## Scripts

- `npm run dev` — local dev server.
- `npm run build` — `tsc --noEmit` then `vite build` (output in `dist/`).
- `npm test` — run Vitest once.
- `npm run build:icons` — rasterize `public/icon.svg` into the PNG icons.

## Deployment

- Pushing to `main` triggers a Netlify deploy (continuous deployment).
- Manual CLI deploys (`npx netlify`) and details: @docs/agent-references/deployment.md

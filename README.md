# Mathle PWA (FR)

A math challenge game as an installable, offline-capable PWA — the maths sibling
of [Boggle FR](https://github.com/gghez/boggle). Play a timed round, then
challenge a friend through the native share sheet: they play the exact same
round from a seed encoded in the shared URL and see the score they have to beat.
No backend — the whole challenge rides in the link.

> **Status: scaffold.** The final game concept is not defined yet. The current
> puzzle is a **placeholder** (60-second mental arithmetic) that exercises the
> full pipeline — seeded challenge, timer, scoring, shareable link, local
> history, build, CI and Netlify deploy — end to end. When the real concept
> lands it replaces `src/game/` (see the `PLACEHOLDER` banners there); the rest
> of the app is concept-agnostic and carries over.

## Stack

Vite + TypeScript (strict), Vitest for the pure game logic, `vite-plugin-pwa`
for the service worker and manifest. No UI framework — direct DOM via the
`el`/`clear` helpers in `src/ui/dom.ts`.

## Develop

```bash
npm install
npm run build:icons  # one-time: rasterize public/icon.svg into the PNG icons
npm run dev          # dev server
npm test             # unit tests
npm run build        # production build (dist/)
npm run preview      # serve the production build
```

## Deploy (Netlify)

The repo ships a `netlify.toml`. On Netlify, "Add new site → Import from Git",
pick this repo, and the settings are picked up automatically:

- Build command: `npm run build`
- Publish directory: `dist`

No environment variables or backend are needed. Netlify serves the site over
HTTPS, which enables the native share sheet and PWA install on mobile. Details
and the manual CLI path: [`docs/agent-references/deployment.md`](docs/agent-references/deployment.md).

## How it works

- `src/core/rng.ts` — seeded PRNG (mulberry32) for reproducible challenges.
- `src/game/` — **placeholder** puzzle: challenge model (seed → problems),
  round timer, scoring engine.
- `src/share/` — encode/decode the challenge (seed + score to beat) into a URL
  token, native share.
- `src/history/store.ts` — past games logged to `localStorage`, capped at 200.
- `src/ui/` — Home / Game / End / Rules / History screens + history-backed
  router.

## Rules

Placeholder rules live in `docs/RULES.md` and are readable in-app via the "?"
help button on the home and end screens.

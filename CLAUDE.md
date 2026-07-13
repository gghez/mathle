# Mathle PWA

French math challenge game: score as many points as possible in a timed round,
then challenge a friend with a shareable link. Maths sibling of the Boggle PWA,
built on the same stack.

> **Concept.** A 3-minute round mixes several exercise types with a
> differentiated point scale — multiplication (+3), exact division (+3), a
> multi-step +/− story (+3, or +5 with a distractor trap), an equation `ax±b=c`
> (+4), and non-trivial worded problems (+10); a wrong answer costs 1 point. All
> problems are generated deterministically from the seed
> (`src/game/challenge.ts`); the finished round can be reviewed answer-by-answer
> (`src/ui/review.ts`), from the end screen or from history (a game record stores
> the answers given, and the seed regenerates the problems). Answers play a
> synthesised win/lose cue with a persisted mute toggle (`src/audio/sfx.ts`). The
> app shell (router, share, history, screens) is concept-agnostic and speaks only
> in terms of `Challenge = seed + scoreToBeat`.

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

Rules live in `docs/RULES.md` and are readable in-app on a dedicated
screen (`src/ui/rules.ts`) reachable via the "?" help button.

## Scripts

- `npm run dev` — local dev server.
- `npm run build` — `tsc --noEmit` then `vite build` (output in `dist/`).
- `npm test` — run Vitest once.
- `npm run build:icons` — rasterize `public/icon.svg` into the PNG icons.

## Browser verification

When verifying the app in the browser preview (not unit tests), it is fine to
temporarily lower `ROUND_SECONDS` in `src/game/challenge.ts` to a small value so
reaching the end-of-round screen doesn't cost the full 3 minutes each time.
Always revert it to `180` before committing. Alternatively, the review screen can
be exercised without playing a round by seeding a `GameRecord` into
`localStorage` (`mathle:history`) and opening it from the in-app history.

## Deployment

- Pushing to `main` triggers a Netlify deploy (continuous deployment).
- Manual CLI deploys (`npx netlify`) and details: @docs/agent-references/deployment.md

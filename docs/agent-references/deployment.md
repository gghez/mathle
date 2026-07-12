# Deployment (Netlify)

The site is a static build hosted on Netlify. No backend. Build config lives in
`netlify.toml` (`npm run build` → publish `dist/`).

## Default path: continuous deployment

Once the GitHub repo is linked to a Netlify site, pushing to `main` triggers a
Netlify build and deploy automatically. This is the normal way to ship — no CLI
needed.

## Manual path: Netlify CLI

The CLI is **not** installed (not in `package.json`, not global). Run it on
demand with `npx netlify <command>` (cached as `netlify-cli`).

Common commands:

```bash
npx netlify status              # show the linked site and auth state
npx netlify link                # link this repo to an existing Netlify site
npx netlify deploy --build      # build + deploy a draft (preview URL, not live)
npx netlify deploy --build --prod   # build + deploy to production
```

`--build` runs the `netlify.toml` build command (`npm run build`) before
uploading, so `dist/` is always fresh. Drop `--build` only if you already ran
`npm run build` and want to deploy the existing `dist/`.

Use the draft deploy (without `--prod`) to verify a build before promoting it.

## Notes

- Auth: the CLI uses the machine's Netlify login. If `npx netlify status` reports
  no account, run `npx netlify login` once.
- After `npx netlify link`, the local `.netlify/state.json` holds the `siteId`;
  it is gitignored (local-only, never committed).
- Prefer the continuous path; reach for the CLI for one-off out-of-band deploys
  or to test a production build locally before pushing.

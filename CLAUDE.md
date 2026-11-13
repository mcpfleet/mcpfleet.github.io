# mcpfleet.github.io

Astro + Starlight site for mcpfleet (landing page and docs, content in `src/content/docs/`), deployed to GitHub Pages. The CLI lives in `mcpfleet/mcpfleet`; the registry API in `mcpfleet/mcpfleet-registry`.

## Commands

```bash
npm ci             # install dependencies exactly as pinned in package-lock.json
npm run dev        # local dev server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the built dist/ locally
```

Use Node 22 (`.nvmrc`; `nvm use` picks it up, `engines` requires >=22.23.4 as astro 7 does).

Deploy (`.github/workflows/deploy.yml`) runs on Node from `.nvmrc` on every push to `main`, on manual dispatch and daily: `npm ci`, then `npm audit --omit=dev --audit-level=high`, then `npm run build`, and publishes `dist/` to GitHub Pages. A high or critical advisory fails push and manual deploys; the daily run only reports it, so `install.sh` keeps being republished. There is no CI on pull requests: run `npm audit --omit=dev --audit-level=high` and `npm run build` locally before merging.

Add or upgrade a dependency with `npm install <package>` and commit the updated `package-lock.json` with it; `npm ci` fails when the lockfile and `package.json` disagree.

## Platform

```yaml
tracker: linear
vcs: github
linear:
  team: NER
  project: 056e7cde-601b-4c2b-a981-5015d37a3de4
github:
  owner: mcpfleet
  repo: mcpfleet.github.io
```

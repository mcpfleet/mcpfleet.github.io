# mcpfleet.github.io

Astro + Starlight site for mcpfleet (landing page and docs, content in `src/content/docs/`), deployed to GitHub Pages. The CLI lives in `mcpfleet/mcpfleet`; the registry API in `mcpfleet/mcpfleet-registry`.

## Commands

```bash
npm install        # install dependencies
npm run dev        # local dev server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the built dist/ locally
```

Deploy (`.github/workflows/deploy.yml`) runs `npm install` and `npm run build` on Node 20 on every push to `main` and publishes `dist/` to GitHub Pages. There is no CI on pull requests: run `npm run build` locally before merging.

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

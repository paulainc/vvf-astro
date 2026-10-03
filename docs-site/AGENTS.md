# AGENTS.md (docs-site)

This is the Starlight documentation site for the VVF Astro project — a separate npm project from the repo root, with its own dependencies. It has no EmDash, Tailwind, or component-library concerns; those belong to the root project (see root [`AGENTS.md`](../AGENTS.md)).

## Setup

```bash
cd docs-site
npm install
npm run dev     # http://localhost:4321 (docs-site only; stop the root dev server first, same port)
npm run build   # also runs as a docs-build check in CI on every PR
```

## Content

Docs pages live in `src/content/docs/*.md` and must be added to the `sidebar` array in `astro.config.mjs` to appear in the nav — Starlight does not auto-discover pages. Keep each page in sync with what it documents in the root project; treat drift as a bug.

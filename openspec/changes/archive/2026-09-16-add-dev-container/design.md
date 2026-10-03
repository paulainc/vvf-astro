## Context

Single-repo Astro project (root app) plus a standalone Astro Starlight docs project (`docs-site/`), no separate database or external services — EmDash uses local SQLite (`data.db`) and local disk (`/uploads`). CI (`.github/workflows/`) pins Node 22 via `actions/setup-node@v4`; the repo itself pins no Node version for local dev today (no `.nvmrc`, no `engines` field). See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- One container definition, matching CI's Node 22, that runs every existing npm script (`dev`, `storybook`, `test:e2e`, `docs-site` dev/build) without extra host setup.
- Zero required manual steps between "open in container" and "run `npm run dev`" for both root and `docs-site/`.

**Non-Goals:**
- No production/deploy container — this is dev-only tooling, scoped like `.storybook/` or `playwright.config.ts`.
- No multi-container orchestration (docker-compose). There's no separate DB or backing service to isolate; root app, Storybook, and docs-site are three npm scripts in one container, not three services.
- Not changing `astro.config.mjs`, CI workflows, or adding an `engines` field to `package.json` (out of scope for this change; CI already pins Node 22 independently).

## Decisions

**Base image: Microsoft's prebuilt `mcr.microsoft.com/devcontainers/javascript-node:22`** instead of a custom Dockerfile from `node:22-slim`.
- Why: it already includes the non-root `node` user and common CLI tooling, on a Debian (bookworm) base compatible with Playwright's own `apt-get`-based dependency installer. Avoids maintaining a hand-rolled Dockerfile for a single Node service.
- Alternative considered: plain `node:22` + manual `apt-get install` for Playwright deps. Rejected — more to maintain for no real benefit at this scale.

**Playwright system dependencies via `npx playwright install --with-deps` in `postCreateCommand`**, not a devcontainer feature.
- Why: there is no official or community devcontainer feature named `playwright` (verified against the `devcontainers/features` and `devcontainers-extra/features` catalogs — neither lists one). `npx playwright install --with-deps` is Playwright's own documented installer, reads the version already pinned in `package.json` (`@playwright/test ^1.63.0`), and needs no third-party registry.
- Alternative considered: a `ghcr.io/devcontainers/features/playwright` feature. Rejected — does not exist; an earlier version of this design assumed it did without verifying, and the container build failed with a registry 403 until checked against the actual feature catalogs.
- Trade-off accepted: reinstalls on every `postCreateCommand` run (container create/rebuild) rather than being baked into a cached image layer. Acceptable at this project's scale — see Risks.

**Dependency install via `postCreateCommand` running `npm install` in both root and `docs-site/`**, not a monorepo tool.
- Why: `docs-site/` is a separate, ungrouped npm project (own `package.json`, no workspaces config in root `package.json`). Two `npm install` calls in `postCreateCommand` matches how a human would set this up per the current README, with no new tooling (e.g. npm workspaces) introduced.
- Alternative considered: introducing npm workspaces to unify installs. Rejected — out of scope; changes root `package.json` structure for a benefit (single install command) that doesn't justify a structural change here.

**Port forwarding: `4321` and `6006` declared in `forwardPorts`**, both editor-agnostic (works in VS Code and Codespaces).
- `docs-site/` dev server also defaults to `4321` (its own `astro.config.mjs` sets no custom port) — same forwarded port covers it since root app and docs-site aren't run simultaneously in normal dev flow. No config changes to `docs-site/astro.config.mjs` needed.

## Risks / Trade-offs

- [`npx playwright install --with-deps` re-downloads browsers on every container create/rebuild, slower than a cached image layer] → Acceptable given `docs-site/`-scale project; revisit with a custom Dockerfile baking browsers into the image if rebuild frequency becomes a real pain point.
- [Contributors without Docker/a devcontainer-capable editor gain nothing] → This is additive; the existing manual `npm install` path in the README stays documented and unchanged, per proposal.md.
- [`postCreateCommand` install failure silently leaves a broken container] → Use `&&`-chained commands so a failed root install stops before attempting `docs-site/`, surfacing the error in the container build log instead of a partial, confusing state.

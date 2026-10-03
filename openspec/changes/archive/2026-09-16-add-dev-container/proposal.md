## Why

New devs set up this repo by hand: install Node at the right version, run `npm install` in both the root and `docs-site/`, install Playwright browsers, know to forward ports 4321 and 6006. Nothing pins the Node version or documents docs-site as a second install. Results vary by device (Node version drift, missing Playwright deps on Linux, etc). A dev container makes setup one step and identical across machines.

## What Changes

- Add a VS Code / GitHub Codespaces dev container (`.devcontainer/devcontainer.json` + `Dockerfile`) pinned to the Node version this project targets, with Playwright's system dependencies preinstalled.
- On container create, install root and `docs-site/` npm dependencies and Playwright browsers automatically.
- Forward the ports the project's services already use: `4321` (Astro site + EmDash admin), `6006` (Storybook), and `4321` for `docs-site` dev server (run one at a time, same default port as the main app).
- Update `README.md` and `docs-site` Getting Started doc to document the dev container as the recommended local setup path, alongside the existing manual `npm install` path.

## Capabilities

### New Capabilities
- `dev-environment`: reproducible containerized local dev environment (container definition, preinstalled tooling, forwarded ports, automated dependency setup) and its documentation.

### Modified Capabilities
(none — no existing specs)

## Impact

- New files: `.devcontainer/devcontainer.json`, `.devcontainer/Dockerfile` (or equivalent single-file `devcontainer.json` using a base image, decided in design.md).
- Docs: `README.md`, `docs-site/src/content/docs/getting-started.md`.
- No changes to application code, `astro.config.mjs`, or CI — this only adds an opt-in local dev path.

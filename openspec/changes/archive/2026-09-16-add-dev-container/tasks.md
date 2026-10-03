## 1. Dev container definition

- [x] 1.1 Create `.devcontainer/devcontainer.json` using base image `mcr.microsoft.com/devcontainers/javascript-node:22` and verify the file is valid JSON with `node -e "JSON.parse(require('fs').readFileSync('.devcontainer/devcontainer.json'))"`
- [x] 1.2 Install Playwright's system dependencies via `npx playwright install --with-deps` in `postCreateCommand` (no `ghcr.io/devcontainers/features/playwright` — verified it does not exist in the official or community feature catalogs; see design.md)
- [x] 1.3 Set `forwardPorts: [4321, 6006]` in `devcontainer.json`
- [x] 1.4 Set `postCreateCommand` to run `npm install` in the root, then `npx playwright install --with-deps`, then `npm install` in `docs-site/`, chained with `&&` so an earlier failure stops the rest

## 2. Verify the container works

- [x] 2.1 Build/open the repo in the dev container (VS Code "Reopen in Container" or equivalent) and verify `postCreateCommand` completes without error, leaving `node_modules/` present in both the root and `docs-site/` — built via `@devcontainers/cli up`, confirmed `node -v` → 22.23.2 and both `node_modules/` dirs present
- [x] 2.2 Inside the container, run `npm run dev` and verify `http://localhost:4321` and `http://localhost:4321/_emdash/admin` are reachable from the host — `/` → 200, `/_emdash/admin` → 302 (unauthenticated redirect, expected)
- [x] 2.3 Inside the container, run `npm run storybook` and verify `http://localhost:6006` is reachable from the host — 200, "Storybook ready!"
- [x] 2.4 Inside the container, run `npm run test:e2e` and verify Playwright runs without needing any additional manual browser/dependency install — 9/9 tests passed, no extra install steps
- [x] 2.5 Inside `docs-site/` in the container, run `npm run dev` and verify the docs site is reachable from the host at `http://localhost:4321` — verified on an alternate port (4322) to avoid clashing with a concurrently running e2e build; same server/config, same result

## 3. Documentation

- [x] 3.1 Update `README.md`'s "Getting started" section to document opening the repo in the dev container as a setup path, alongside the existing manual `npm install` steps
- [x] 3.2 Update `docs-site/src/content/docs/getting-started.md`'s "Install and run" section with the same dev container setup path
- [x] 3.3 Verify both docs describe: what the dev container preinstalls (Node 22, Playwright deps, npm deps for root and `docs-site/`) and which ports are forwarded

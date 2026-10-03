## 1. Install and verify the Basecamp CLI locally

- [x] 1.1 Run `curl -fsSL https://basecamp.com/install-cli | bash` locally and confirm the `basecamp` binary is on PATH (`basecamp --version` or equivalent succeeds)
- [x] 1.2 Run the CLI's `--help` (and any subcommand `--help`) to record the exact commands for: checking auth status, listing to-dos, and marking a to-do complete — note these in a short comment or fixture so later steps use confirmed syntax, not guesses
  - Confirmed: `basecamp auth login`, `basecamp auth status`, `basecamp cards list -p 43742602`, `basecamp cards done <id|url>` (VVF project has To-dos disabled; it uses a Card Table named "Tareas" instead — see design.md decision)
- [x] 1.3 Complete the CLI's login flow against the VVF Basecamp project and verify an authenticated command (e.g. list cards) returns real data
  - Verified: `basecamp auth login` (device flow) succeeded, `basecamp auth status` shows authenticated/full scope, `basecamp projects list` and `basecamp cards list -p 43742602` returned live VVF data

## 2. Add CLI install to the dev container

- [x] 2.1 Add the CLI install command to `.devcontainer/devcontainer.json`'s `postCreateCommand` (additive to the existing `npm install` / Playwright steps, not replacing them) and verify a container rebuild ends with `basecamp` present on PATH
  - Verified with a real `devcontainer up` + `exec`: base image's default remote user is `node` (home `/home/node`), which isn't on the image's default PATH, so `remoteEnv.PATH` was added to append `/home/node/.local/bin` — confirmed `command -v basecamp` resolves post-rebuild
- [x] 2.2 Verify the added install step does not block or fail the rest of `postCreateCommand` if the CLI download is briefly unavailable (e.g. wrap so a non-zero exit there doesn't abort the npm installs)
  - Verified: `(curl ... | bash || true); npm install && ...` — simulated a failing curl in the exact pattern and confirmed the following `&&`-chained commands still executed (separate `;`-terminated statement, not part of the same `&&` chain)
- [x] 2.3 Confirm no credential file the CLI produces ends up tracked by git (`git status` clean after a local login); add a `.gitignore` entry only if one does
  - Verified inside the container: CLI config/credentials live at `/home/node/.config/basecamp`, entirely outside `/workspaces/vvf_astro` (the mounted repo) — nothing for git to see, no `.gitignore` entry needed

## 3. Document setup and the ticket workflow

- [x] 3.1 Add a "Basecamp CLI setup" section to `README.md` (and the docs-site Getting Started page, matching the existing dev-environment doc pattern) covering: install command, login step, and which Basecamp project/card table to connect to
- [x] 3.2 Add the ticket-to-change convention to `AGENTS.md` (or a linked doc): a Basecamp card's URL goes in the openspec change's proposal.md when the change is created from that card; archiving the change means running `basecamp cards done <id|url>` on that same card
- [x] 3.3 Verify by reading both docs end-to-end as a new contributor would: install → login → confirm a card is reachable via the CLI
  - Verified inside a fresh container: `basecamp` already installed per docs (devcontainer step), `basecamp auth status` correctly reports "Not authenticated" until the documented `basecamp auth login` step is run — matches the docs' described flow

## 4. End-to-end verification

- [x] 4.1 Using a real VVF "Tareas" card, confirm the full loop works: card is listable via the CLI, its URL can be referenced from an openspec change proposal, and `basecamp cards done <id|url>` marks it complete — verified against the live VVF board before this change is archived
  - Verified: created throwaway card `10310082831` on the live VVF board, confirmed it in `basecamp cards list`, ran `basecamp cards done 10310082831` (moved to real "Done" column, `completed: true`), then trashed it to leave the board clean

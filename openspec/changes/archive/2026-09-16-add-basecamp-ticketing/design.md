## Context

See proposal.md - Why. This repo has no ticketing system today; requirements are described directly to an agent. The Basecamp CLI (`basecamp.com/agents`, install via `curl -fsSL https://basecamp.com/install-cli | bash`) is explicitly built for shell-capable AI agents and is currently a technology preview. Confirmed during implementation: the VVF Basecamp project (id `43742602`) has the To-dos tool disabled and instead uses a Card Table named "Tareas" (`basecamp cards ...`) as its existing task board — so cards, not to-dos, are the real ticket unit for this project. The repo already has a dev container (`.devcontainer/devcontainer.json`, from the `dev-environment` capability) whose `postCreateCommand` runs `npm install` for root and `docs-site/`.

## Goals / Non-Goals

**Goals:**
- Any contributor or agent can install the CLI and authenticate against the VVF Basecamp account from this repo (in or out of the dev container).
- A documented, manual convention links a card on VVF's "Tareas" board to the openspec change that implements it, in both directions (change references the card; archiving the change moves the card to Done).

**Non-Goals:**
- No webhook, polling, or CI-triggered sync between Basecamp and this repo — every Basecamp read/write is an explicit CLI call a person or agent runs.
- No change to the openspec CLI, schema, or `.openspec.yaml` — the card reference lives in proposal.md prose, not new tooling.
- No support for multiple Basecamp accounts/projects — the single VVF project (id `43742602`) is the target; no change to its enabled Basecamp tools (To-dos stays off, Tareas stays the ticket board).

## Decisions

**Install path: extend the dev container's `postCreateCommand`, auth stays manual.**
Add the CLI's install script to `postCreateCommand` (or a `postCreateCommand.sh` if it grows) so the binary is present on container create, matching how npm deps are already auto-installed. Do not attempt to automate `basecamp auth login` there: it's an interactive OAuth device flow (open a URL, enter a code, approve in a browser), which can't run non-interactively in `postCreateCommand`. Contributors run the login step once, manually, after the container is up. This keeps the CLI's own credential storage (outside the repo) as the only place tokens live — nothing for this repo to manage or rotate.
Alternative considered: document manual CLI install only, no devcontainer change. Rejected because the dev-environment capability's whole point is "preinstalled tooling out of the box"; leaving the CLI out would make it the one manual exception.

**Ticket unit: Basecamp cards on the existing "Tareas" board, not to-dos.**
The VVF project's To-dos dock item is disabled; the team already tracks work on a Card Table called "Tareas" (project id `43742602`). Rather than enabling a second, redundant tool (To-dos) on the project, this integration targets the card table that's already in use: `basecamp cards list -p 43742602`, `basecamp cards done <id>` to close one out.
Alternative considered: enable To-dos on the VVF project and use `basecamp todos ...` as originally scoped. Rejected (explicit call) to avoid introducing a second, unused ticket surface when Tareas already serves that purpose.

**Credential storage: CLI's own default config location, not repo-local files.**
Rely on whatever the Basecamp CLI uses by default (per its own install docs) rather than inventing a project-specific token file. Add a defensive `.gitignore` entry only if the installed CLI turns out to write any local file inside the repo (verified in tasks, not assumed here).

**Ticket-to-change linkage: manual convention in proposal.md, not new automation.**
When a Basecamp card becomes an openspec change, the change's `proposal.md` "Why" or "Impact" section includes the card's Basecamp URL. When the change is archived, whoever archives it runs `basecamp cards done <id|url>` against that same card. This is documented as a step in the project's contribution docs (README or AGENTS.md), not enforced by tooling — enforcing it would require new scripting against a CLI whose command surface isn't stable yet.
Alternative considered: a git hook or openspec archive hook that auto-completes the card. Rejected for now: the CLI is a technology preview with no documented stable command contract to script against reliably; revisit once the CLI surface is confirmed stable.

## Risks / Trade-offs

- [Basecamp CLI is a technology preview; exact subcommand names/flags aren't guaranteed stable long-term] → confirmed during implementation against the installed v0.11.0 CLI: `basecamp auth login`, `basecamp auth status`, `basecamp cards list -p 43742602`, `basecamp cards done <id|url>`. Docs cite these exact commands so a CLI update that changes them is a visible doc-drift issue, not a silent failure.
- [Manual linkage convention can be forgotten, leaving cards open or changes untraceable] → keep the convention short (one URL line in proposal.md, one CLI command on archive) and documented alongside the existing openspec workflow docs so it's part of the same habit, not a separate process.
- [Devcontainer `postCreateCommand` change could slow container creation or fail on networks without CLI install access] → install step is additive and independent of the existing `npm install`/Playwright steps; a failure there shouldn't be allowed to block the rest of `postCreateCommand` (verified in tasks).
- [Confirmed in the dev container: no OS keyring is available there, so the CLI falls back to storing the OAuth token in plaintext at `~/.config/basecamp/credentials.json`] → still outside the repo/git, but docs call out treating that file as a secret on shared or ephemeral containers.

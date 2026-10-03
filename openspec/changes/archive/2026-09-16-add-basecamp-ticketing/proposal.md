## Why

The Victoria Venezuela Foundation project has no ticketing system: requirements arrive ad hoc and aren't tracked as discrete, closeable work items. Basecamp's official CLI (`basecamp.com/agents`) lets any shell-capable AI agent — including Claude Code — read and act on Basecamp directly, so the team can run requirements through the VVF project's existing "Tareas" card table as the ticket source instead of inventing a separate tracker.

## What Changes

- Install and authenticate the Basecamp CLI locally (and in the dev container) so contributors and agents can query and update Basecamp from this repo.
- Document the one-time Basecamp OAuth app + CLI login setup, since no Basecamp credentials exist for this project yet.
- Define a ticket-to-requirements workflow: a card on the VVF project's "Tareas" board is the unit of a requirement; starting work on one creates a linked openspec change, and completing the change's implementation marks the card done in Basecamp.
- No webhook/automatic sync: all Basecamp reads/writes happen through explicit CLI calls the agent or contributor runs, not a background service.

## Capabilities

### New Capabilities
- `basecamp-ticketing`: local Basecamp CLI connectivity (install, auth) and the workflow mapping cards on the VVF project's "Tareas" board to openspec changes for tracking and closing requirements.

### Modified Capabilities
(none — dev container changes here are setup/tooling, not a change to an existing documented requirement)

## Impact

- New/changed files: `.devcontainer/devcontainer.json` (or `postCreateCommand`) to install the CLI; `README.md` / `docs-site` setup docs for the auth step; possibly a small `openspec/` or repo-level doc describing the ticket-to-change workflow.
- No application code changes (Astro site, `docs-site/`, tests untouched).
- New external dependency: each contributor/agent needs a Basecamp account with access to the VVF project (id `43742602`) and completes the CLI's own device-flow login (no separate OAuth app registration needed; credentials live in the CLI's local config, never committed).

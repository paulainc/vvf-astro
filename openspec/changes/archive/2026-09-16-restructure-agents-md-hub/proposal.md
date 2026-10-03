## Why

`AGENTS.md` is the only file an AI agent reads by default in this repo, and it currently mixes generic operating instructions (MCP, dev commands, skills) with nothing pointing at the conventions that actually vary by task — design tokens, component tiering, testing setup. Those conventions exist (Tailwind config, `docs-site` docs) but nothing tells an agent they're there, so context gets rebuilt from scratch or invented each session (e.g. hardcoded hex colors instead of the `brand`/`pastel`/`ink` tokens already defined in `tailwind.config.cjs`). `docs-site/` is also a second, independently-run npm project with its own conventions (Starlight authoring, no EmDash/Tailwind concerns) but no agent guidance of its own — an agent working there inherits root `AGENTS.md` instructions that don't apply. Finally, root `AGENTS.md` isn't visible to tools that read `CLAUDE.md` instead, so multi-model setups (Claude Code alongside opencode/Codex-style agents) get inconsistent instructions depending on which file loads.

## What Changes

- Trim root `AGENTS.md` to a hub: keep only what's true for every task in this project (Astro MCP note, dev commands, skill pointer), and add a short "Conventions" section linking out to `docs-site/src/content/docs/architecture.md`, `components.md`, `testing-and-ci.md`, and a new `styling.md`.
- Add `docs-site/src/content/docs/styling.md` documenting the design tokens already defined in `tailwind.config.cjs` (brand/pastel/ink colors, display font sizes, `section` spacing, `pill`/`card` radii) — these exist in code but aren't written down anywhere.
- Add `docs-site/AGENTS.md` scoped to that subproject: Starlight content authoring, its own `npm install`/`npm run dev`, and that it has no EmDash/Tailwind/component-library concerns.
- Symlink `CLAUDE.md -> AGENTS.md` at the repo root and `docs-site/CLAUDE.md -> AGENTS.md` in `docs-site/`, so Claude Code and any `AGENTS.md`-reading tool see identical instructions without hand-syncing two files.
- Non-goal: no new Claude Code or opencode skills. `.claude/skills/` (openspec) and `.opencode/skills/astro` already cover the "skill for a specific, non-general task" pattern; nothing else here is narrow enough to warrant one.

## Capabilities

### New Capabilities
- `agent-guidance`: how AI agents get project instructions in this repo — the root and `docs-site/` `AGENTS.md` hub files, the spoke docs they link to, and the `CLAUDE.md` symlinks that keep multi-model instructions in sync.

### Modified Capabilities
(none — no existing specs)

## Impact

- `AGENTS.md` (root): rewritten, shorter.
- `CLAUDE.md` (root, new): symlink to `AGENTS.md`.
- `docs-site/AGENTS.md` (new) and `docs-site/CLAUDE.md` (new): symlink pair for the subproject.
- `docs-site/src/content/docs/styling.md` (new): design token reference, built into `docs-site`'s Starlight output alongside the existing docs pages.
- No app code, build, or CI changes.

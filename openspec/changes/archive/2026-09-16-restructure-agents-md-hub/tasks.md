## 1. Styling spoke doc

- [x] 1.1 Add `docs-site/src/content/docs/styling.md` documenting the `brand`/`pastel`/`ink` color scales, `display`/`sans` font families, custom font sizes (`eyebrow`, `display-sm/md/lg/xl`, `stat`), `pill`/`card` radii, and `section`/`section-sm` spacing from `tailwind.config.cjs` — verify by running `cd docs-site && npm run build` and confirming the new page renders in the Starlight nav alongside architecture/components/testing-and-ci

## 2. Root AGENTS.md hub

- [x] 2.1 Rewrite root `AGENTS.md` to keep only Astro MCP usage, dev commands, and skill pointers, plus a "Conventions" section linking to `docs-site/src/content/docs/architecture.md`, `components.md`, `testing-and-ci.md`, and `styling.md` — verify by reading the file top to bottom and confirming no topic-specific content (component tiers, content model, test commands) is inline
- [x] 2.2 Symlink `CLAUDE.md -> AGENTS.md` at the repo root — verify with `ls -la CLAUDE.md` showing it as a symlink and `readlink CLAUDE.md` resolving to `AGENTS.md`

## 3. docs-site scoped hub

- [x] 3.1 Create `docs-site/AGENTS.md` covering only docs-site's own setup (`npm install`/`npm run dev` inside `docs-site/`) and its Starlight content-authoring scope, explicitly noting it has no EmDash/Tailwind/component-library concerns — verify by reading it and confirming it doesn't repeat root `AGENTS.md`'s dev-command or MCP instructions
- [x] 3.2 Symlink `docs-site/CLAUDE.md -> AGENTS.md` — verify with `ls -la docs-site/CLAUDE.md` showing it as a symlink and `readlink docs-site/CLAUDE.md` resolving to `AGENTS.md`

## 4. Verification

- [x] 4.1 Confirm root README's "Tooling" section still accurately describes `.claude/`/`.opencode/` usage after the hub rewrite (update if it now conflicts with the new `AGENTS.md` wording)
- [x] 4.2 Run `openspec validate restructure-agents-md-hub --strict` and confirm it passes

## Purpose

Defines how an AI coding agent working in this repo discovers project instructions: a slim root hub file, a scoped hub for the `docs-site/` subproject, the spoke docs each hub links to, and the symlinks that keep `CLAUDE.md` in sync with `AGENTS.md` for multi-model tooling.

## ADDED Requirements

### Requirement: Root AGENTS.md stays a slim hub
Root `AGENTS.md` SHALL contain only instructions that apply to every task in the repo (MCP server usage, dev commands, skill pointers) plus a links section pointing to spoke docs for anything that varies by task (architecture, components, styling, testing). It SHALL NOT contain the substantive content of those topics inline.

#### Scenario: Agent needs a design token
- **WHEN** an agent reads root `AGENTS.md` while about to write Tailwind classes
- **THEN** it finds a link to a styling doc rather than needing to open `tailwind.config.cjs` unprompted or invent a color

#### Scenario: Hub omits topic-specific detail
- **WHEN** root `AGENTS.md` is read in full
- **THEN** it contains no component-tiering rules, no content-model/EmDash details, and no testing/CI steps inline — those live only in the linked spoke docs

### Requirement: Styling spoke doc documents existing design tokens
A styling doc SHALL exist under `docs-site/src/content/docs/` describing the design tokens already defined in `tailwind.config.cjs`: the `brand`, `pastel`, and `ink` color scales, the `display`/`sans` font families, the custom font sizes (`eyebrow`, `display-sm/md/lg/xl`, `stat`), the `pill`/`card` border radii, and the `section`/`section-sm` spacing values.

#### Scenario: Agent styles a new component
- **WHEN** an agent is asked to add or restyle a component and consults the styling doc
- **THEN** it finds the token names to use (e.g. `brand-navy`, `text-display-md`, `rounded-card`) instead of hardcoding hex values or arbitrary Tailwind values that duplicate an existing token

### Requirement: docs-site has its own scoped hub
`docs-site/AGENTS.md` SHALL exist and SHALL describe only what applies to working in `docs-site/`: it is a separate npm project (own `npm install`/`npm run dev`), it authors Starlight content pages, and it has no EmDash, Tailwind, or component-library concerns. It SHALL NOT repeat root `AGENTS.md`'s dev-command or MCP instructions.

#### Scenario: Agent opens a shell inside docs-site/
- **WHEN** an agent is working on a file under `docs-site/` and reads `docs-site/AGENTS.md`
- **THEN** it learns docs-site's own run commands and content-authoring scope without being told to use the root project's EmDash/Tailwind/component conventions, which don't apply there

### Requirement: CLAUDE.md mirrors AGENTS.md via symlink
Root `CLAUDE.md` SHALL be a symlink to root `AGENTS.md`, and `docs-site/CLAUDE.md` SHALL be a symlink to `docs-site/AGENTS.md`. No project instructions SHALL be duplicated as separate file content between an `AGENTS.md` and its corresponding `CLAUDE.md`.

#### Scenario: AGENTS.md is updated later
- **WHEN** someone edits root `AGENTS.md` after this change lands
- **THEN** a tool that reads `CLAUDE.md` instead sees the same updated content immediately, with no second file to edit

#### Scenario: Claude Code opens the repo
- **WHEN** Claude Code looks for `CLAUDE.md` at the repo root or in `docs-site/`
- **THEN** it finds a valid file (via symlink) containing the same hub instructions an `AGENTS.md`-reading tool would see

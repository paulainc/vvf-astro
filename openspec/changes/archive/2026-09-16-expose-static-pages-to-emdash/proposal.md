## Why

`/_emdash/admin` only shows content that lives in EmDash's own collections (events, posts, team_members, children, etc.). The 7 static `.astro` pages that aren't a collection's detail or index route (home, contact, privacy policy, sponsor-a-child landing, etc.) are invisible to it, so staff have no way to see the full set of live pages, or that a new one was added, without reading the codebase.

## What Changes

- Add a `pages` EmDash collection (title, route path, source file, last-synced timestamp) that represents every static, non-collection-backed route under `src/pages`.
- Add a sync routine that scans `src/pages/**/*.astro`, excludes collection-detail (`[slug].astro`) and collection-index routes already represented by their own collections, and upserts one `pages` row per remaining static route.
- Run the sync automatically on the **first incoming request after server start** (via middleware, guarded so it runs once per process), so it covers both `astro dev` and the deployed `@astrojs/node` standalone server without a manual command and without needing a live server during the `astro build` compile step itself (EmDash's only non-fragile write path, `EmDashClient` over HTTP with a PAT, needs a running server to call — `astro build` has none).
- Sync writes go through `EmDashClient` (`emdash/client`) authenticated with a service PAT read from an env var, upserting via `onConflict: "update"` semantics — never direct DB/table access (EmDash's schema/DB modules aren't in its public `exports`, so importing them is a fragile deep-import that breaks on version bumps).
- Rows for routes that no longer exist on disk are marked stale (not deleted), so removed pages don't silently vanish from history; deciding whether to auto-delete vs. flag is left to design.md.

## Capabilities

### New Capabilities
- `static-page-sync`: scanning `src/pages` for static routes and keeping an EmDash `pages` collection in sync with what's on disk, so the admin dashboard reflects every live page automatically.

### Modified Capabilities
(none — `/_emdash/admin` itself is EmDash's own UI, not a capability of this repo)

## Impact

- New: a `pages` collection definition (seeded via `emdash/seed`'s `applySeed`), a scan/sync module, and middleware wiring in `src/middleware.ts` (or equivalent).
- New: a service PAT (EmDash Personal Access Token) generated once and stored as an env var, used only by the sync routine.
- No changes to existing collections (events, posts, team_members, children) or their detail pages.
- Depends on `surface-emdash-admin` (already applied) for the admin-access documentation this extends.

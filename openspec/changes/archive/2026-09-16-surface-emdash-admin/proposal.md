## Why

EmDash already tracks draft/published/archived status and page counts per collection, but the built-in admin UI that surfaces it (`/_emdash/admin`) isn't linked anywhere in the project, so staff have no documented way to find it or confirm it's safe to use in production.

## What Changes

- Document the `/_emdash/admin` URL as the staff-facing place to see which pages exist and their draft/published/archived status, per EmDash's built-in dashboard (`total`/`published`/`draft`/`scheduled`/`overdueScheduled` per collection).
- Verify and record that the route is already gated: `node_modules/emdash/src/astro/middleware/auth.ts` redirects unauthenticated requests to `/_emdash/admin/login`, and the dev-only bypass (`/_emdash/api/auth/dev-bypass`) is hard-gated by `import.meta.env.DEV`, which Vite/Astro sets to `false` for any `astro build` output — no config change needed.
- Add a short "Admin" pointer to internal docs (e.g. `README.md`, alongside the existing local-dev admin URL note at `README.md:28`) rather than the public site `Header.astro`/`Footer.astro`, since this is an internal tool, not a public-facing link.

## Capabilities

No spec-level behavior changes; this is a documentation/verification change only (`skip_specs: true`).

## Impact

- `README.md`: add a staff-facing admin access note.
- No application code, routes, or auth config changes — EmDash's existing middleware already enforces login.

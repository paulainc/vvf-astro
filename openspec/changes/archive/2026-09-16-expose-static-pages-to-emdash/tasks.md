## 1. Collection setup

- [x] 1.1 Generate an EmDash service PAT via the admin UI's token settings, store it as `EMDASH_SYNC_PAT` in `.env` (and document it in `.env.example` without the value), and verify a test `EmDashClient` call authenticates successfully
- [x] 1.2 Define the `pages` collection (fields: route path, source file path, last-synced timestamp, stale flag) via `emdash/seed`'s seed file format and apply it once so the collection exists, then verify it appears in `/_emdash/admin`'s sidebar with 0 entries

## 2. Scan + sync module

- [x] 2.1 Write a route-scan function that globs `src/pages/**/*.astro`, excludes `[slug].astro` and index routes belonging to `events`/`posts`/`team_members`/`children`, and verify it returns exactly the 7 known static routes today
- [x] 2.2 Write a sync function using `EmDashClient` that upserts one `pages` row per scanned route (create if missing, update `last-synced` if present) and verify it against a running dev server: first run creates 7 rows, second run updates timestamps without duplicating
- [x] 2.3 Add stale-flagging: on sync, mark any existing `pages` row whose source file no longer exists as stale, and verify by temporarily renaming a page file, re-running sync, and confirming the row flips to stale rather than disappearing

## 3. Automatic trigger

- [x] 3.1 Create `src/middleware.ts` (or extend it) with a process-lifetime guard that runs the sync once on the first incoming request, after EmDash's own middleware in the `sequence()` chain, wrapped in try/catch that logs and no-ops on failure
- [x] 3.2 Verify in `astro dev`: stop the dev server, add a new dummy static page under `src/pages`, restart, make one request, and confirm the new route appears as a `pages` row without running any manual command
- [x] 3.3 Verify against a production-style run (`astro build` + `node ./dist/server/entry.mjs`, per the pattern used in `surface-emdash-admin`'s verification): first request triggers sync, subsequent requests don't re-run it (add a temporary log line or timing check to confirm no repeat work)
- [x] 3.4 Remove the dummy page and any temporary debug logging added for verification

## 4. Documentation

- [x] 4.1 Update `README.md`'s "Staff: content admin" note (added in `surface-emdash-admin`) to mention the `pages` collection now lists static routes automatically, and document the one-time `EMDASH_SYNC_PAT` setup step for anyone standing up a new environment

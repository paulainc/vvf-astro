## Context

See `proposal.md` - Why. `node_modules/emdash` v0.38.0 exposes two relevant public entry points (confirmed in its `package.json` `exports` map, not deep imports): `emdash/seed` (`applySeed`, idempotent, `onConflict: "skip"|"update"|"error"`) and `emdash/client` (`EmDashClient`, full CRUD over HTTP, authenticated with a PAT or `devBypass: true` for localhost). Its internal DB/schema modules (`src/database/*`, `src/schema/registry.ts`) are not exported, so importing them directly is unsupported and will break on version bumps. `astro build` compiles the server bundle but does not run a listening HTTP server, so `EmDashClient` (HTTP-based) cannot be called mid-build; the deployed `@astrojs/node` standalone server is the only point where a self-call is possible. No `src/middleware.ts` exists yet in this repo.

## Goals / Non-Goals

**Goals:**
- New static pages appear in `/_emdash/admin` without a developer running a manual command.
- Use only EmDash's public API surface (`emdash/client`, `emdash/seed`), never its internal DB modules.
- Work identically for local dev and the deployed process, without depending on a specific hosting platform's build/deploy hooks.

**Non-Goals:**
- Draft/publish workflow for static pages (they have no such concept today; this change only makes them visible, not editable/schedulable).
- Auto-deleting `pages` rows for removed routes (stale-flag only, per the spec).
- Syncing anything other than route existence (no content diffing, no SEO metadata extraction).

## Decisions

**Sync mechanism: `emdash/client` over HTTP with a PAT, not direct DB writes or `emdash/seed`.**
`emdash/seed`'s `applySeed` needs a Kysely `db` handle, and the only public route to one is the CLI's internal `createDatabase()`, which is not exported - using it would mean reimplementing/depending on unexported internals. `EmDashClient` is fully public, supports `create`/`update` and collection/field creation, and is the only supported path that doesn't touch EmDash internals directly. Trade-off: it requires the server to be listening (see next decision) and a PAT to manage.

**Trigger: sync-on-first-request middleware, not a build hook.**
Since `astro build` has no live server to call, and EmDash's own integration doesn't expose a "DB ready" signal outside the request lifecycle, the sync runs from a project-authored middleware (`src/middleware.ts`) that: on the first request after process start, calls the scan+sync function in-process (no self-HTTP-call needed - the sync module runs server-side and uses `EmDashClient` pointed at `import.meta.env.EMDASH_BASE_URL ?? "http://localhost:<port>"`), guarded by an in-memory flag so it only runs once per process. This covers `astro dev` and the deployed node server uniformly - "build" as a trigger point doesn't exist for this mechanism.

**Auth: dedicated service PAT via env var, not `devBypass`.**
`devBypass: true` only works on localhost and is explicitly dev-only (see `surface-emdash-admin`'s verification that it 403s outside dev). Production needs a real PAT. One is generated once via the admin UI's token settings (manual, one-time setup step - not part of the automated sync) and stored as `EMDASH_SYNC_PAT`.

**Collection shape: new `pages` collection, not reuse of an existing one.**
Static pages have a different shape (route path, source file, no rich content body) than existing collections; forcing them into `events`/`posts` etc. would pollute those collections' semantics.

## Risks / Trade-offs

- [First request after a fresh deploy is slower, since it does the scan+sync inline] -> acceptable: scan is a fast filesystem glob (14 files today), sync is a handful of upserts; do not block the response on sync completion if it can run fire-and-forget after headers are sent.
- [PAT leakage if committed or logged] -> stored only in env var (`.env`, gitignored, matching existing `.env.example` convention), never logged; document rotation in the PAT-setup task.
- [EmDash version bump changes `EmDashClient`'s public API shape] -> pin an exact `emdash` version (already the case per `package.json`) and note this as a re-verification point on future EmDash upgrades.
- [Middleware ordering: this must not run before EmDash's own `astro:server:setup`/migrations have prepared `data.db`] -> register the sync middleware after EmDash's own middleware chain in `src/middleware.ts`'s `sequence()`, and guard with a try/catch that logs and no-ops on failure rather than crashing requests.

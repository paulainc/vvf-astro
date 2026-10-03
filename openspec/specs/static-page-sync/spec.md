# static-page-sync Specification

## Purpose

Keeps EmDash's admin dashboard showing every static, non-collection-backed page in the site automatically, so staff can see the full page inventory without reading the codebase or manually registering each page.

## Requirements

### Requirement: Static route discovery
The system SHALL identify every static route under `src/pages` that is not backed by an existing EmDash collection (i.e. excluding `[slug].astro` detail routes and their corresponding index/listing routes for `events`, `posts`, `team_members`, and `children`).

#### Scenario: New static page added
- **WHEN** a developer adds a new `.astro` file under `src/pages` that is not a collection-detail or collection-index route
- **THEN** the system includes that route's path in the next sync

#### Scenario: Collection-backed route excluded
- **WHEN** the scan encounters `src/pages/blog/[slug].astro` or `src/pages/blog/index.astro`
- **THEN** the system excludes it from the static-page set, since `posts` already represents it

### Requirement: Sync to EmDash pages collection
The system SHALL upsert one row per discovered static route into an EmDash `pages` collection, keyed by route path, using `EmDashClient` authenticated with a service PAT.

#### Scenario: First sync creates rows
- **WHEN** the `pages` collection has no row for a discovered route
- **THEN** the system creates one, recording at least the route path, source file path, and a last-synced timestamp

#### Scenario: Re-sync updates existing rows
- **WHEN** a previously-synced route is discovered again with an unchanged source file
- **THEN** the system updates the row's last-synced timestamp without creating a duplicate

### Requirement: Automatic trigger, no manual step
The system SHALL run the sync automatically on the first incoming HTTP request after server process start, for both `astro dev` and the deployed `@astrojs/node` standalone server, without requiring a developer to run a manual command.

#### Scenario: Dev server started, first page load
- **WHEN** `astro dev` starts and a browser makes the first request to any route
- **THEN** the sync runs once for that process before or alongside serving the request

#### Scenario: Sync does not block normal requests
- **WHEN** the sync has already run for the current process
- **THEN** subsequent requests are served without re-running the sync

### Requirement: Removed pages are flagged, not deleted
The system SHALL mark a previously-synced `pages` row as stale when its source file no longer exists on disk, rather than deleting the row.

#### Scenario: Page file removed
- **WHEN** a route that was previously synced no longer has a corresponding file under `src/pages`
- **THEN** the system marks that row stale on the next sync instead of removing it

# basecamp-ticketing Specification

## Purpose

Lets contributors and AI agents track VVF project requirements as cards on Basecamp's "Tareas" Card Table and work them through openspec changes, using the official Basecamp CLI for all reads and writes.

## Requirements

### Requirement: Local Basecamp CLI access
A contributor or agent working in this repo SHALL be able to run the Basecamp CLI locally (inside or outside the dev container) to read and act on the VVF Basecamp project's "Tareas" card table, once authenticated.

#### Scenario: CLI installed but not yet authenticated
- **WHEN** a contributor runs a Basecamp CLI command without having completed login
- **THEN** the CLI reports that authentication is required and does not silently fail or return partial data

#### Scenario: CLI installed and authenticated
- **WHEN** an authenticated contributor or agent runs a Basecamp CLI command against the VVF project's card table (e.g. list cards)
- **THEN** the command returns live data from that Basecamp project

### Requirement: Documented one-time auth setup
The project's setup documentation SHALL describe how to install the Basecamp CLI and complete its login flow, since no Basecamp credentials exist for this project until a contributor creates them.

#### Scenario: New contributor sets up Basecamp access
- **WHEN** a new contributor follows the repo's setup docs to gain Basecamp CLI access
- **THEN** they find the install command, the login step, and which Basecamp project (VVF) and card table (Tareas) to connect to, without needing to ask a teammate

### Requirement: Credentials never committed to the repo
Basecamp CLI credentials (OAuth tokens, client secrets) SHALL be stored outside version control, in the CLI's own local config or environment variables ignored by git.

#### Scenario: Contributor completes login
- **WHEN** a contributor authenticates the Basecamp CLI
- **THEN** no token, secret, or credential file the login produces is tracked by git in this repo

### Requirement: Basecamp card maps to an openspec change
Starting implementation work on a Basecamp "Tareas" card SHALL produce an openspec change that records which card it implements, so the two stay traceable to each other.

#### Scenario: Agent picks up a Basecamp card
- **WHEN** a contributor or agent starts an openspec change to implement a requirement sourced from a specific Basecamp card
- **THEN** the change's proposal references that card (by Basecamp card URL or ID)

### Requirement: Completing a change closes its Basecamp card
Archiving an openspec change that implements a Basecamp card SHALL result in that card being marked done in Basecamp via the CLI.

#### Scenario: Change archived after implementation
- **WHEN** an openspec change linked to a Basecamp card is archived
- **THEN** the linked Basecamp card is moved to the Done column using a Basecamp CLI command, not left open

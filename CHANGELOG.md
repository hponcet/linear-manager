# Change Log

All notable changes to the "linear-issue-manager" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Cursor agent rules for communication, feature testing, and changelog maintenance
- Unit and integration test scaffolding with example branch and extension tests

### Changed

- Show assignee initials on a colored avatar icon in the My Issues tree view (PNG files cached in extension storage)
- Post-change verification now includes `npm run test` alongside typecheck and lint
- Reduced Linear API usage: slower TreeView auto-refresh with pause on window blur, visibility refetch guard, mutation sync without redundant fetches, lazy issue history pagination, lightweight Start Work context, and shared metadata cache in the extension host
- Centralized all Linear API access through `LinearService` in the extension host; webviews now use IPC instead of per-panel SDK clients

### Fixed

- Refreshed the issue tree view when an issue assignee changed, including icon, tooltip, and list membership in My Issues and Current Cycle

### Added

- `linearManager.autoRefreshIntervalSeconds` setting (default 180s, 0 to disable)
- Temporary Linear API call logging in development (`LinearApiLogger`)
- `LinearService` facade with TTL cache, request deduplication, and centralized invalidation

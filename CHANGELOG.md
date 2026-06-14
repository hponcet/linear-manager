# Change Log

All notable changes to the "linear-issue-manager" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Pull requests sidebar view listing open PRs for the current repository via the connected git provider
- Git provider configuration (GitHub, GitLab, Bitbucket Cloud) in Git Settings with OAuth
- Create/View pull request actions when an issue branch is configured, with VS Code Quick Pick to choose the target branch before opening the compare page
- Cursor agent rules for communication, feature testing, and changelog maintenance
- Unit and integration test scaffolding with example branch and extension tests

### Changed

- Pull requests sidebar items open the linked Linear issue on click (or the PR on the web when no ticket is found), show the linked assignee icon from My Issues when a ticket is found, and expose diff / checkout / web PR actions in the context menu with inline diff and web buttons on hover
- Bitbucket Git Settings now default to HTTP access tokens (Atlassian account) with step-by-step setup; OAuth consumer flow documents the correct workspace settings path instead of personal settings
- Provider connection panel collapses when signed in, showing only status and Sign out until expanded
- Reworked Git Settings layout with a dedicated provider connection panel, collapsible setup instructions, and a separate branch & workflow section
- Git Settings form fields use bordered input controls and a distinct credentials panel, separate from setup instructions
- Improved Git Settings OAuth UX with provider-specific Sign in buttons, redirect URI copy, and setup instructions
- Post-change verification now includes `npm run test` alongside typecheck and lint
- Reduced Linear API usage: slower TreeView auto-refresh with pause on window blur, visibility refetch guard, mutation sync without redundant fetches, lazy issue history pagination, lightweight Start Work context, and shared metadata cache in the extension host
- Centralized all Linear API access through `LinearService` in the extension host; webviews now use IPC instead of per-panel SDK clients

### Fixed

- GitHub Sign out in Settings now updates the connection UI instead of staying connected while the VS Code GitHub session remains active
- Bitbucket HTTP access tokens now authenticate with Basic auth (Atlassian email + token) instead of Bearer, matching Atlassian API requirements
- Refreshed the issue tree view when an issue assignee changed, including icon, tooltip, and list membership in My Issues and Current Cycle

### Added

- `linearManager.autoRefreshIntervalSeconds` setting (default 180s, 0 to disable)
- Temporary Linear API call logging in development (`LinearApiLogger`)
- `LinearService` facade with TTL cache, request deduplication, and centralized invalidation

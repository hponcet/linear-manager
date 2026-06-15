# Change Log

All notable changes to the "linear-issue-manager" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- My Issues tree hover actions: create pull request (when a branch is configured) and open on Linear
- `get_issue_comments` MCP tool to load Linear issue discussion threads for Cursor agents
- `{{editorLanguage}}` placeholder in agent prompt templates (resolved from the editor UI language)
- Settings gear buttons in the My issues and Pull requests tree view headers open Settings on the Workflow and Git tabs respectively
- **Start work with agent** (Cursor only): sidebar context action and Start Work option to open Cursor Composer with a minimal prompt; a bundled **Linear Manager MCP server** exposes issue, related-issue, pull request, and diff tools
- **Review with agent** (Cursor only): pull request context action that opens Cursor Composer to review the PR diff via MCP and suggest improvements
- `@` user mentions with autocomplete in issue comments, replies, and sub-issue descriptions
- Pull requests sidebar view listing open PRs for the current repository via the connected git provider
- Git provider configuration (GitHub, GitLab, Bitbucket Cloud) in Git Settings with OAuth
- Create/View pull request actions when an issue branch is configured, with VS Code Quick Pick to choose the target branch before opening the compare page
- Cursor agent rules for communication, feature testing, and changelog maintenance
- Unit and integration test scaffolding with example branch and extension tests
- `linearManager.autoRefreshIntervalSeconds` setting (default 180s, 0 to disable)

### Fixed

- Replaced the broken pull request header icon with the VS Code `git-pull-request-create` codicon
- My Issues checkout hover button now uses the same icon as the issue header checkout action
- Settings tree view gear buttons now switch tabs when Settings is already open
- Fixed Start work with agent and Review with agent opening an empty Composer tab by pasting the generated prompt after `composer.newAgentChat` opens (Cursor does not accept a `{ prompt }` command argument)
- Fixed MCP pull request tools failing with "Git remote is not configured" by resolving origin from git when building server env, refreshing env when the repository becomes active, and preferring local git diffs when sourceBranch and targetBranch are provided
- Fixed extension failing to activate on Cursor versions below VS Code 1.120 by restoring the `engines.vscode` minimum while keeping MCP registration guarded at runtime
- Fixed "Trying to add a disposable to a DisposableStore that has already been disposed" when reconnecting Linear or reloading the extension by tracking view-owned disposables separately from extension subscriptions and guarding async initialization after deactivate
- Fixed extension reconnect leaving My Issues assignee icons and the Pull requests sidebar empty by fully disposing tree views and command registrations before re-initializing
- GitHub Sign out in Settings now updates the connection UI instead of staying connected while the VS Code GitHub session remains active
- Bitbucket HTTP access tokens now authenticate with Basic auth (Atlassian email + token) instead of Bearer, matching Atlassian API requirements
- Refreshed the issue tree view when an issue assignee changed, including icon, tooltip, and list membership in My Issues and Current Cycle

### Changed

- Persisted My Issues tree view expand/collapse state per workspace and view mode
- Split webview bundles per panel (issue, settings, startWork) so each panel loads only its own JS/CSS
- Git provider setup instructions now include clickable links to external pages (API token creation, OAuth setup, documentation)
- Issue and pull request review agent prompts now load issue comments via MCP and ask the agent to respond in the editor language
- Pull request review agent prompt now asks for clear, concise feedback with code excerpts and proposed fixes

- Start Work shows a **Start work with agent** button after branch setup instead of a toggle during branch creation
- Reworked Settings layout with expandable RSuite panels, clearer title hierarchy, flatter sidebar tabs without borders, unified accordion header hover, and VS Code–aligned styling
- Settings opens on the Workflow tab by default and lists Workflow first in the sidebar
- Start work with agent and Review with agent prompts now instruct the agent to load the Linear ticket via MCP first, then implement (or fix PR gaps against the linked issue) instead of stopping at planning
- Added a **Work with agent** settings tab to customize issue and pull request review prompt templates with placeholders
- Pull requests sidebar items open the linked Linear issue on click (or the PR on the web when no ticket is found), show the linked assignee icon from My Issues when a ticket is found, and expose diff / checkout / web PR actions in the context menu with inline diff and web buttons on hover
- Bitbucket Git Settings now default to HTTP access tokens (Atlassian account) with step-by-step setup; OAuth consumer flow documents the correct workspace settings path instead of personal settings
- Provider connection panel collapses when signed in, showing only status and Sign out until expanded
- Reworked Git Settings layout with a dedicated provider connection panel, collapsible setup instructions, and a separate branch & workflow section
- Git Settings form fields use bordered input controls and a distinct credentials panel, separate from setup instructions
- Improved Git Settings OAuth UX with provider-specific Sign in buttons, redirect URI copy, and setup instructions
- Post-change verification now includes `npm run test` alongside typecheck and lint
- Reduced Linear API usage: slower TreeView auto-refresh with pause on window blur, visibility refetch guard, mutation sync without redundant fetches, lazy issue history pagination, lightweight Start Work context, and shared metadata cache in the extension host
- Centralized all Linear API access through `LinearService` in the extension host; webviews now use IPC instead of per-panel SDK clients

### Removed

- `linearManager.launchAgentAfterStartWork` workspace setting and the automatic agent launch toggle from Start Work
- Temporary Linear API call logging in development (`LinearApiLogger`)
- `LinearService` facade with TTL cache, request deduplication, and centralized invalidation

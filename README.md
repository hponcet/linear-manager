# Linear Manager

Unofficial [Linear](https://linear.app) extension for VS Code and Cursor. Manage issues, branches, pull requests, and agent workflows without leaving the editor.

## Features

### Issues and workflow

- Connect your Linear account and browse **My Issues** or **Current Cycle** in the activity bar
- Open issues in a rich React panel (TipTap editor, comments, sub-issues, attachments, history)
- Drag and drop issues from the tree view to open them
- Move issues between workflow states via drag and drop (multi-select supported)
- Persisted expand/collapse state for teams and workflow columns
- Assignee avatar icons in the tree view
- Inline hover actions on issues:
  - **Start work** or **Checkout** (when a branch is configured)
  - **Create pull request** (when a branch exists and a git provider is connected)
  - **Open on Linear**

### Git and pull requests

- Start Work flow: create or bind a branch, update issue state/cycle, optional stash
- Git provider settings for **GitHub**, **GitLab**, and **Bitbucket Cloud** (OAuth or API token)
- **Pull requests** sidebar: open linked issues, diff, checkout source branch, open on the web
- Create or open pull requests from issue branches (target branch picker)

### Settings

- **Workflow**: branch naming, prefixes, stash-before-create, auto-refresh interval
- **Git**: provider connection, credentials, setup instructions with clickable links
- **Work with agent** (Cursor): customizable prompt templates with placeholders

### Cursor agent integration (Cursor only)

- **Start work with agent**: open Composer with a prompt that loads the Linear ticket via MCP
- **Review with agent**: review a PR diff with linked-issue context via MCP
- Bundled **Linear Manager MCP server** (issues, comments, related issues, PR metadata, diffs)
- Agent prompts support `{{editorLanguage}}` and instruct the agent to respond in the editor UI language

## Prerequisites

- VS Code **1.105.0** or higher (including Cursor)
- [Linear Connect](https://marketplace.visualstudio.com/items?itemName=linear.linear-connect) extension
- Git extension (`vscode.git`, usually built-in)

## Installation

1. Install **Linear Manager** from the marketplace (or load the VSIX in development)
2. Reload the window
3. Open the Linear activity bar view and run **Connect to Linear**

## Usage

### Connect and browse

1. Open **Linear manager** in the activity bar
2. Run **Connect to Linear** if you are not authenticated
3. Use **My issues** to see assigned work, or toggle **Current Cycle** from the view title bar

### Work on an issue

- **Open**: click an issue, use the context menu, or drag it to the editor
- **Start work**: create/configure a Git branch from the context menu or inline play button
- **Checkout**: switch to the issue branch (inline button when a branch is configured)
- **Create pull request**: inline button when a branch and git provider are configured
- **Open on Linear**: inline external-link button or context menu

### Pull requests view

When a git provider is connected for the current repository:

- Lists open pull requests for the origin remote
- Click a row to open the linked Linear issue (or the PR on the web)
- Inline actions: review with agent (Cursor), open diff, checkout branch, open on web

### Keyboard shortcuts

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Cmd+K I` (Mac) / `Ctrl+K I` (Win/Linux) | Open Issue for Current Branch | Open the Linear issue for the current Git branch |

### Commands (selection)

| Command | Description |
|---------|-------------|
| Connect / Disconnect from Linear | Authenticate or sign out |
| Open Issue | Open issue in the editor panel |
| Open on Linear | Open issue in the browser |
| Start work on issue | Branch setup workflow |
| Start work with agent | Launch Cursor Composer with issue MCP context (Cursor) |
| Checkout to branch | Switch to the issue branch |
| Create pull request | Open provider compare/create flow |
| Review with agent | Review PR with MCP context (Cursor) |
| Refresh / Toggle View | Reload data or switch My Issues ↔ Current Cycle |
| Open settings | Workflow, Git, and agent prompt settings |

## Project structure

```
src/
├── extension.ts              # Activation entry point
├── controller.ts             # Extension lifecycle and services
├── linear/                   # LinearService, API, caching
├── git/                      # Git client, branch checkout, diffs
├── gitProviders/             # GitHub, GitLab, Bitbucket integrations
├── mcp/                      # Bundled Linear Manager MCP server
├── cursor/                   # Agent prompts, Cursor detection, MCP registration
├── panels/                   # Webview panels (issue, start work, settings)
├── views/
│   ├── myIssues/             # My Issues tree view
│   └── pullRequests/         # Pull requests tree view
├── webviews/                 # React UI (issue panel, settings, start work)
└── test/                     # Unit and integration tests
```

## Development

### Install

```bash
npm install
```

### Watch mode

```bash
npm run watch
```

Press **F5** to launch an Extension Development Host.

### Build

```bash
npm run package
```

### Verification

```bash
npm run check:types && npm run lint && npm run test
```

When CSS/SCSS files change, also run:

```bash
npm run lint:styles
```

Or run everything:

```bash
npm run lint:all
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run watch` | Extension + webview rebuild on change |
| `npm run compile` | Compile extension host |
| `npm run package` | Production webpack build |
| `npm run check:types` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run lint:styles` | Stylelint (CSS/SCSS) |
| `npm run lint:all` | ESLint + Prettier + Stylelint |
| `npm run test` | Unit and integration tests |
| `npm run analyze:webview` | Webpack bundle analysis (webview) |

## Tech stack

- **Extension host**: TypeScript, VS Code Extension API, Linear SDK, Simple Git
- **Webviews**: React, TipTap, RSuite, Sass
- **Build**: Webpack, Fork TS Checker
- **Quality**: ESLint, Stylelint, Prettier, Mocha + `@vscode/test-electron`

## Contributing

Contributions are welcome. Please open an issue or PR on [GitHub](https://github.com/hponcet/linear-manager).

Before submitting:

1. Run `npm run check:types && npm run lint && npm run test` (and `npm run lint:styles` if you changed styles)
2. Add tests for testable logic changes
3. Update [CHANGELOG.md](./CHANGELOG.md) for user-visible features and fixes

## License

MIT

## Issues

Report bugs or request features on [GitHub Issues](https://github.com/hponcet/linear-manager/issues).

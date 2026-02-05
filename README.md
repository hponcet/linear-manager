# Linear Manager - VS Code Extension

A powerful VS Code extension to manage your Linear issues directly from your code editor.

## 🚀 Features

- **Complete Linear integration**: Connect your Linear account and access your issues
- **Dedicated activity view**: View your assigned issues or current cycle issues in the VS Code sidebar
- **Issue management**: Open, view, and start working on your issues directly from VS Code
- **Rich user interface**: Modern React interface with rich editor and intuitive selectors
- **Git integration**: Automatic branch creation and Git workflow management
- **Comments and activity**: View and add comments on your issues
- **Drag & Drop**: Drag issues from the TreeView to the editor to open them
- **Quick branch checkout**: One-click checkout to issue branches with inline action buttons
- **View modes**: Switch between "My Issues" and "Current Cycle" views
- **Keyboard shortcuts**: Quick access to issues with customizable shortcuts

## 📋 Prerequisites

- VS Code version 1.107.0 or higher
- `linear.linear-connect` extension installed
- `vscode.git` extension (usually already included)

## 🔧 Installation

1. Install the extension from the VS Code marketplace
2. Restart VS Code
3. Click on the Linear icon in the activity bar
4. Connect your Linear account with the "Connect to Linear" command

## 📖 Usage

### Connecting to Linear

1. Open the "Linear manager" view in the sidebar
2. Click on "Connect to Linear" to authenticate your account
3. Your assigned issues will appear in the "My issues" view

### Issue management

- **Open an issue**: Click on an issue, use the context menu, or drag it to the editor
- **Start working**: Use "Start Work" from the context menu to automatically create a Git branch
- **Configure branch**: Once a branch is created, use "Configure branch" to modify settings
- **Checkout to branch**: Click the branch icon on issues with initialized branches
- **Move your issues**: From the "My Issues" view, you can change issue status with simple drag and drop. You can also select multiple issues.

### View modes

Use the filter button in the TreeView title bar to switch between:
- **My Issues**: View issues assigned to you
- **Current Cycle**: View all issues from the active sprint/cycle of your teams

### Keyboard shortcuts

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Cmd+K I` (Mac) / `Ctrl+K I` (Windows/Linux) | Open Issue for Current Branch | Opens the Linear issue associated with your current Git branch |

### Available commands

| Command | Description |
|---------|-------------|
| `Linear manager: Connect to Linear` | Connect your Linear account |
| `Linear manager: Disconnect from Linear` | Disconnect your Linear account |
| `Linear manager: Open Issue` | Open an issue in the editor |
| `Linear manager: Open Issue on Linear.app` | Open an issue in the browser |
| `Linear manager: Open Issue for Current Branch` | Open the issue linked to the current branch |
| `Linear manager: Start work on issue` | Create/configure a branch for an issue |
| `Linear manager: Configure branch for issue` | Modify branch settings for an issue |
| `Linear manager: Checkout to branch` | Switch to the issue's branch |
| `Linear manager: Refresh` | Refresh the issues list |
| `Linear manager: Toggle View` | Switch between My Issues and Current Cycle views |

### TreeView actions

- **Inline buttons**: 
  - ▶️ (Play): Start work on an issue (when no branch is configured)
  - 🌿 (Branch): Checkout to issue branch (when branch is configured)
- **Refresh button**: Reload all data from Linear
- **Filter button**: Toggle between My Issues and Current Cycle views
- **Tooltips**: Hover over issues to see the title and branch name (if configured)

## 🏗️ Project structure

```
src/
├── extension.ts           # Extension entry point
├── commands.ts           # VS Code commands
├── controller.ts         # Main controller
├── constants.ts          # Constants and enums
├── linear/              # Linear API integration
├── git/                 # Git integration
├── panels/              # Webview panels
├── views/               # TreeView providers
│   └── myIssues/        # Issues TreeView module
│       ├── MyIssuesView.ts    # Main TreeView class
│       ├── dataFetching.ts    # Data fetching utilities
│       ├── dragAndDrop.ts     # Drag & drop handlers
│       ├── treeItems.ts       # TreeItem factories
│       ├── types.ts           # Types and constants
│       └── index.ts           # Module exports
├── webviews/            # React interface
│   ├── components/      # Reusable React components
│   └── views/           # Main views
└── types/               # TypeScript definitions
```

## 🛠️ Development

### Install dependencies

```bash
npm install
```

### Development with watch mode

```bash
npm run watch
```

### Build the project

```bash
npm run package
```

### Tests

```bash
npm run test
```

## 🏗️ Technologies used

- **Backend**: TypeScript, VS Code Extension API
- **Frontend**: React, TipTap (rich editor), Rsuite (UI components)
- **Integrations**: Linear SDK, Simple Git
- **Build**: Webpack, PostCSS, Sass

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Available scripts

- `npm run watch`: Development with automatic reload
- `npm run compile`: TypeScript code compilation
- `npm run package`: Production build
- `npm run lint`: Code verification with ESLint
- `npm run test`: Run tests

## 📄 License

This project is licensed under the MIT License.

## 🐛 Report an issue

If you encounter a problem or have a suggestion for improvement, feel free to [open an issue](https://github.com/hponcet/linear-manager/issues).

---

Developed with ❤️ to improve your Linear workflow in VS Code.

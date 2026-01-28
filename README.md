# Linear Manager - VS Code Extension

A powerful VS Code extension to manage your Linear issues directly from your code editor.

## 🚀 Features

- **Complete Linear integration**: Connect your Linear account and access your issues
- **Dedicated activity view**: View your assigned issues in the VS Code sidebar
- **Issue management**: Open, view, and start working on your issues directly from VS Code
- **Rich user interface**: Modern React interface with rich editor and intuitive selectors
- **Git integration**: Automatic branch creation and Git workflow management
- **Comments and activity**: View and add comments on your issues

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

1. Open the "Linear issue manager" view in the sidebar
2. Click on "Connect to Linear" to authenticate your account
3. Your assigned issues will appear in the "My issues" view

### Issue management

- **Open an issue**: Simply click on it or via the context menu
- **Start working**: Use "Start Work" from the context menu to automatically create a Git branch
- **Move your issues**: From the "My Issues" view, you can change issue status with simple drag and drop. You can also select multiple issues.

### Available commands

- `linearManager.connect`: Connect your Linear account
- `linearManager.disconnet`: Disconnect your Linear account

## 🏗️ Project structure

```
src/
├── extension.ts           # Extension entry point
├── commands.ts           # VS Code commands
├── controller.ts         # Main controller
├── linear/              # Linear API integration
├── git/                # Git integration
├── panels/             # Webview panels
├── webviews/           # React interface
│   ├── components/     # Reusable React components
│   └── views/         # Main views
└── types/             # TypeScript definitions
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

# Copilot instructions

## Language and repository safety

- Reply to users in their language, but write every repository artifact in English, including source code, comments, docstrings, UI strings, documentation, rules, changelog entries, commits, and pull-request descriptions.
- Never commit secrets, credentials, `.env` files, local paths, generated output, or machine-specific configuration.

## Implementation

Use Ponytail for every coding task. Before writing code, stop at the first option that works:

1. Do not build speculative work (YAGNI).
2. Reuse existing repository code.
3. Use the standard library.
4. Use a native platform feature.
5. Reuse an installed dependency.
6. Write the smallest clear implementation.

Understand the task and trace the affected flow before applying this ladder. Fix bugs at the shared root cause after checking callers. Do not simplify validation at trust boundaries, data-loss prevention, security, accessibility, explicit requirements, or a focused check for non-trivial logic. Avoid unrequested abstractions, dependencies, boilerplate, and speculative configuration.

## Graphify

When `graphify-out/graph.json` exists, use `npm run graphify:query -- "<question>"`, `graphify path`, or `graphify explain` before broad codebase exploration. Use source search only after Graphify has oriented the work, or when the graph does not exist. Prefer `graphify-out/wiki/index.md` for broad navigation and read `graphify-out/GRAPH_REPORT.md` only for broad architecture work. Refresh the local graph with `npm run graphify:update` after code changes when the CLI is installed. Do not make Graphify a CI, npm-install, or commit-hook requirement.

## Testing and verification

- Use `npm`; the repository enforces it during installation.
- Run `npm run check:types && npm run lint && npm run test` before finishing a code change. Also run `npm run lint:styles` when CSS or SCSS files change.
- Add a focused Mocha unit test in `src/test/unit/` for pure logic, and an integration test in `src/test/integration/` for extension-host behavior. Cover the happy path and a meaningful edge case for each new public function. Add regression coverage for bug fixes at the lowest feasible layer.
- Use relative imports in tests and do not call the real Linear API; stub `LinearClient`, `GitClient`, or extract pure logic instead.
- For webview-only work that cannot be automated, include a manual smoke checklist in the pull-request summary.
- VS Code theme variables (`--vscode-*`) and BEM-style class names are allowed when needed; use the existing file-level Stylelint disables from `Settings.scss` and `StartWorkHeader.scss`.

## Changelog

Update `CHANGELOG.md` for user-visible features, fixes, breaking changes, and notable behavior changes. Use the existing Keep a Changelog format under `[Unreleased]` with concise past-tense entries. Do not add changelog entries for refactors, internal-only changes, dependency bumps, or contributor-only rule changes.

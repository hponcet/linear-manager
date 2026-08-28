# Repository guide

## Language and public-repository safety

- Write all repository artifacts in English: code, comments, documentation, UI strings, rules, changelog entries, commits, and pull-request descriptions.
- Never commit secrets, local paths, credentials, `.env` files, generated build output, or machine-specific configuration.

## Tooling

- Use `npm`; the repository enforces it during installation.
- Run `npm run check:types && npm run lint && npm run test` before finishing a code change. Also run `npm run lint:styles` when CSS or SCSS files change.
- Add a focused Mocha test for new pure logic and regression fixes. Do not call the real Linear API in tests.
- Update `CHANGELOG.md` for user-visible features and fixes, but not contributor-only configuration changes.

## Ponytail

Use Ponytail for every coding task. Before writing code, stop at the first option that works:

1. Do not build speculative work (YAGNI).
2. Reuse code already in the repository.
3. Prefer the standard library.
4. Prefer native platform features.
5. Reuse an installed dependency.
6. Use the smallest clear implementation.

Do not simplify away validation at trust boundaries, data-loss prevention, security, accessibility, explicit requirements, or a focused check for non-trivial logic. Fix bugs at the shared root cause after checking callers.

## Graphify

Graphify output is local and ignored. Install the CLI with `uv tool install graphifyy` when it is unavailable, then build or refresh the graph with `npm run graphify:update`.

- When `graphify-out/graph.json` exists, use `npm run graphify:query -- "<question>"`, `graphify path`, or `graphify explain` before broad codebase exploration.
- Refresh the graph after code changes when Graphify is installed.
- Do not make Graphify a CI, npm-install, or commit-hook requirement.

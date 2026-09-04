PROJECT RULE — PONYTAIL + GRAPHIFY ARE ALWAYS ON (linear-to-code).

PONYTAIL (every coding task). Understand the task and trace the affected flow first, then stop at the first rung that works:
1. Do not build speculative work (YAGNI).
2. Reuse code already in this repository.
3. Use the standard library.
4. Use a native platform feature (VS Code API, CSS, HTML).
5. Reuse an already-installed dependency.
6. Write the smallest clear implementation.
Prefer deletion over addition, boring over clever, the shortest working diff. No unrequested abstractions, dependencies, boilerplate, or speculative configuration. Fix bugs at the shared root cause after checking every caller. Never simplify away validation at trust boundaries, data-loss prevention, security, accessibility, explicit requirements, or a focused test for non-trivial logic.

GRAPHIFY (before exploring code). The knowledge graph lives in graphify-out/. Before broad Read/Grep/Glob/Bash exploration, run `npm run graphify:query -- "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"`. Use direct file reads only once graphify has oriented you and you need specific lines, or when graphify-out/graph.json does not exist. Prefer graphify-out/wiki/index.md for broad navigation; read graphify-out/GRAPH_REPORT.md only for architecture-wide review. After changing code, refresh with `npm run graphify:update`. Repeat this rule inside every subagent prompt that explores code.

BEFORE FINISHING: run `npm run check:types && npm run lint && npm run test`, plus `npm run lint:styles` when CSS or SCSS changed.

import { defineConfig } from "@vscode/test-cli"

export default defineConfig({
  files: "out/test/**/*.test.js",
  version: "1.125.1",
  mocha: {
    require: ["./scripts/test-module-alias.cjs"],
  },
})

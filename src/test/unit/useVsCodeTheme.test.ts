import * as assert from "assert"

import { resolveVsCodeThemeKind } from "../../webviews/hooks/useVsCodeTheme"

suite("resolveVsCodeThemeKind", () => {
  test("returns light when body has vscode-light", () => {
    assert.strictEqual(resolveVsCodeThemeKind(["vscode-light"]), "light")
  })

  test("returns high-contrast when body has vscode-high-contrast", () => {
    assert.strictEqual(resolveVsCodeThemeKind(["vscode-high-contrast"]), "high-contrast")
  })

  test("returns dark when body has vscode-dark", () => {
    assert.strictEqual(resolveVsCodeThemeKind(["vscode-dark"]), "dark")
  })

  test("defaults to dark when no vscode theme class is present", () => {
    assert.strictEqual(resolveVsCodeThemeKind([]), "dark")
  })

  test("prefers high-contrast over light when both are present", () => {
    assert.strictEqual(
      resolveVsCodeThemeKind(["vscode-light", "vscode-high-contrast"]),
      "high-contrast",
    )
  })
})

import * as assert from "assert"

import { isCursorEditorFromValues } from "../../cursor/detectCursorEnvironment"

suite("detectCursorEnvironment", () => {
  test("isCursorEditor detects Cursor app name and uri scheme", () => {
    assert.strictEqual(isCursorEditorFromValues("Cursor", "vscode"), true)
    assert.strictEqual(isCursorEditorFromValues("Visual Studio Code", "cursor"), true)
    assert.strictEqual(isCursorEditorFromValues("Visual Studio Code", "vscode"), false)
  })
})

import * as assert from "assert"

import * as vscode from "vscode"

suite("Extension integration", () => {
  test("linear-to-code extension is registered", () => {
    const extension = vscode.extensions.getExtension("hpon.linear-to-code")
    assert.ok(extension, "linear-to-code extension should be registered")
  })
})

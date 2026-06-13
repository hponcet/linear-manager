import * as assert from "assert"

import * as vscode from "vscode"

suite("Extension integration", () => {
  test("linear-manager extension is registered", () => {
    const extension = vscode.extensions.getExtension("hpon.linear-manager")
    assert.ok(extension, "linear-manager extension should be registered")
  })
})

import * as assert from "assert"

import { ExtensionMode } from "vscode"

import { getWebviewAssetDirectory, getWebviewScriptPolicy } from "../../panels/AbstractWebview"
import { parseAllowedExternalUrl } from "../../utils/parseAllowedExternalUrl"

suite("AbstractWebview content security policy", () => {
  test("allows webpack eval only outside production extension hosts", () => {
    assert.strictEqual(
      getWebviewScriptPolicy("vscode-webview:", "test-nonce", ExtensionMode.Development),
      "vscode-webview: 'unsafe-eval'",
    )
    assert.strictEqual(
      getWebviewScriptPolicy("vscode-webview:", "test-nonce", ExtensionMode.Test),
      "vscode-webview: 'unsafe-eval'",
    )
    assert.strictEqual(
      getWebviewScriptPolicy("vscode-webview:", "test-nonce", ExtensionMode.Production),
      "vscode-webview: 'nonce-test-nonce'",
    )
  })

  test("isolates development webview assets from production builds", () => {
    assert.strictEqual(getWebviewAssetDirectory(ExtensionMode.Development), "dist-webviews-dev")
    assert.strictEqual(getWebviewAssetDirectory(ExtensionMode.Test), "dist-webviews-dev")
    assert.strictEqual(getWebviewAssetDirectory(ExtensionMode.Production), "dist")
  })
})

suite("AbstractWebview external URL validation", () => {
  test("allows web and email links", () => {
    assert.strictEqual(parseAllowedExternalUrl("https://linear.app").protocol, "https:")
    assert.strictEqual(parseAllowedExternalUrl("http://localhost:3000/docs").protocol, "http:")
    assert.strictEqual(parseAllowedExternalUrl("mailto:user@example.com").protocol, "mailto:")
  })

  test("rejects privileged and unknown protocols", () => {
    for (const url of [
      "command:workbench.action.openSettings",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "vscode://settings/editor.fontSize",
    ]) {
      assert.throws(() => parseAllowedExternalUrl(url), /Unsupported external URL protocol/)
    }
    assert.throws(() => parseAllowedExternalUrl("not a URL"))
  })
})

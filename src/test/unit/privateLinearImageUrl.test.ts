import * as assert from "assert"

import {
  getCanonicalPrivateLinearAssetUrl,
  getCanonicalPrivateLinearImageUrl,
  isPrivateLinearImageUrl,
} from "../../webviews/components/Editor/markdownPlugins/privateLinearImageUrl"

suite("private Linear image URLs", () => {
  test("removes only Linear's confirmed signature parameter", () => {
    const source =
      "https://uploads.linear.app/team/image.png?signature=secret&token=keep&X-Goog-Signature=keep-too#preview"
    const canonical = getCanonicalPrivateLinearImageUrl(source)

    assert.ok(canonical)
    assert.strictEqual(getCanonicalPrivateLinearAssetUrl(source), canonical)
    const url = new URL(canonical)
    assert.strictEqual(url.searchParams.has("signature"), false)
    assert.strictEqual(url.searchParams.get("token"), "keep")
    assert.strictEqual(url.searchParams.get("X-Goog-Signature"), "keep-too")
    assert.strictEqual(url.hash, "#preview")
  })

  test("accepts only the exact HTTPS uploads origin", () => {
    assert.strictEqual(isPrivateLinearImageUrl("https://uploads.linear.app/image.png"), true)

    for (const source of [
      "http://uploads.linear.app/image.png",
      "https://uploads.linear.app:444/image.png",
      "https://uploads.linear.app.evil.test/image.png",
      "https://user:secret@uploads.linear.app/image.png",
      "https://linear.app/image.png",
      "data:image/png;base64,AAAA",
      "not a URL",
    ]) {
      assert.strictEqual(isPrivateLinearImageUrl(source), false, source)
      assert.strictEqual(getCanonicalPrivateLinearImageUrl(source), null, source)
    }
  })
})

import * as assert from "assert"

import { lookupVideoMimeType } from "../../webviews/components/Editor/markdownPlugins/VideosPlugin/videoMimeType"

suite("lookupVideoMimeType", () => {
  test("maps known video extensions", () => {
    assert.strictEqual(lookupVideoMimeType("https://cdn.example.com/clip.mp4"), "video/mp4")
    assert.strictEqual(
      lookupVideoMimeType("https://cdn.example.com/clip.webm?token=1"),
      "video/webm",
    )
  })

  test("falls back to video/mp4 for unknown extensions", () => {
    assert.strictEqual(lookupVideoMimeType("https://cdn.example.com/clip.unknown"), "video/mp4")
    assert.strictEqual(lookupVideoMimeType(undefined), "video/mp4")
  })
})

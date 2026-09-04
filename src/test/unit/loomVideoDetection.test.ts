import * as assert from "assert"

import {
  getLoomEmbedUrl,
  isSupportedVideoUrl,
  parseVideoMarkdown,
} from "../../webviews/components/Editor/markdownPlugins/VideosPlugin/videoMarkdownDetection"

suite("Loom video detection", () => {
  test("accepts only exact HTTPS Loom share and embed URLs", () => {
    for (const source of [
      "https://loom.com/share/abc_123?sid=ignored",
      "https://www.loom.com/embed/abc_123",
    ]) {
      assert.strictEqual(getLoomEmbedUrl(source), "https://www.loom.com/embed/abc_123")
      assert.strictEqual(isSupportedVideoUrl(source), true)
    }

    for (const source of [
      "http://loom.com/share/abc",
      "https://loom.com:444/share/abc",
      "https://user:secret@loom.com/share/abc",
      "https://evil.loom.com/share/abc",
      "https://loom.com/watch/abc",
      "https://loom.com/share/a%2Fb",
      "https://loom.com/share/abc/extra",
      "not a URL",
    ]) {
      assert.strictEqual(getLoomEmbedUrl(source), null, source)
      assert.strictEqual(isSupportedVideoUrl(source), false, source)
    }
  })

  test("parses Loom only from image-style embed Markdown", () => {
    assert.deepStrictEqual(parseVideoMarkdown("![](https://loom.com/share/abc_123)"), {
      raw: "![](https://loom.com/share/abc_123)",
      src: "https://loom.com/share/abc_123",
      title: "",
      destinationTitle: null,
      syntax: "embed",
    })
    assert.strictEqual(parseVideoMarkdown("[](https://loom.com/share/abc_123)"), null)
  })

  test("plays an unnamed provider link and keeps a named one as a link", () => {
    for (const [source, label] of [
      ["https://www.loom.com/share/abc_123", "abc_123"],
      ["https://www.youtube.com/watch?v=M7lc1UVf-VE", "watch?v=M7lc1UVf-VE"],
    ]) {
      assert.deepStrictEqual(parseVideoMarkdown(`[${label}](<${source}>)`), {
        raw: `[${label}](<${source}>)`,
        src: source,
        title: label,
        destinationTitle: null,
        syntax: "link",
      })
      assert.strictEqual(parseVideoMarkdown(`[Watch it](<${source}>)`), null, source)
    }
  })
})

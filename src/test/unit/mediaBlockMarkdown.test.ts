import * as assert from "assert"

import { inspectLinearMarkdown } from "../../webviews/components/Editor/linearMarkdown"

suite("Linear media blocks", () => {
  test("keeps standalone image, audio, video, and Loom media in their own paragraphs", () => {
    for (const [source, type] of [
      ["![Image](https://cdn.example.com/image.png)", "image"],
      ["![Pixel](data:image/png;base64,AAAA)", "image"],
      ["![Audio](https://uploads.linear.app/audio.mp3)", "audio"],
      ["![Video](https://uploads.linear.app/video.mp4)", "video"],
      ["![](https://www.loom.com/share/abc_123)", "video"],
    ]) {
      const inspection = inspectLinearMarkdown(source)

      assert.strictEqual(
        inspection.ok,
        true,
        inspection.ok ? undefined : inspection.diagnostics[0]?.message,
      )
      if (inspection.ok) {
        const paragraph = inspection.document.content?.[0]
        assert.strictEqual(paragraph?.type, "paragraph")
        assert.strictEqual(paragraph?.content?.[0]?.type, type)
      }
    }
  })

  test("plays an extensionless uploaded video whether Linear sends it as a link or an embed", () => {
    const url = "https://uploads.linear.app/workspace/upload/asset-uuid?signature=fixture-token"

    for (const source of [
      `[linear-markdown-video.mp4](<${url}>)`,
      `![linear-markdown-video.mp4](${url})`,
    ]) {
      const inspection = inspectLinearMarkdown(source)

      assert.strictEqual(
        inspection.ok,
        true,
        inspection.ok ? undefined : inspection.diagnostics[0]?.message,
      )
      if (inspection.ok) {
        const video = inspection.document.content?.[0]?.content?.[0]
        assert.strictEqual(video?.type, "video", source)
        assert.strictEqual(video?.attrs?.title, "linear-markdown-video.mp4")
      }
    }
  })

  test("plays an uploaded asset Linear labelled after its own URL", () => {
    const url = "https://uploads.linear.app/workspace/upload/asset-uuid?signature=fresh-token"

    for (const source of [
      `[asset-uuid](<${url}>)`,
      `[asset-uuid?signature=stale-token](<${url}>)`,
    ]) {
      const inspection = inspectLinearMarkdown(source)

      assert.strictEqual(
        inspection.ok,
        true,
        inspection.ok ? undefined : inspection.diagnostics[0]?.message,
      )
      if (inspection.ok) {
        assert.strictEqual(inspection.document.content?.[0]?.content?.[0]?.type, "video", source)
      }
    }

    const named = inspectLinearMarkdown(`[Download video](<${url}>)`)
    assert.strictEqual(named.ok, true)
    if (named.ok) {
      assert.strictEqual(named.document.content?.[0]?.content?.[0]?.type, "text")
    }
  })

  test("rejects linked images because Linear drops the outer link", () => {
    const source = "[![Image](https://cdn.example.com/image.png)](https://example.com)"
    const inspection = inspectLinearMarkdown(source)

    assert.strictEqual(inspection.ok, false)
    if (!inspection.ok) {
      assert.strictEqual(inspection.source, source)
      assert.ok(inspection.diagnostics.some(({ code }) => code === "unsupported-syntax"))
    }
  })
})

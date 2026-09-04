import * as assert from "assert"

import { inspectLinearMarkdown } from "../../webviews/components/Editor/linearMarkdown"

suite("private Linear media", () => {
  for (const [name, extension, nodeType] of [
    ["audio", "mp3", "audio"],
    ["video", "mp4", "video"],
  ] as const) {
    test(`stores a canonical ${name} URL`, () => {
      const canonical = `https://uploads.linear.app/workspace/asset.${extension}?download=1`
      const inspection = inspectLinearMarkdown(`![Asset](${canonical}&signature=short-lived)`)

      assert.strictEqual(
        inspection.ok,
        true,
        inspection.ok ? undefined : inspection.diagnostics[0]?.message,
      )
      if (!inspection.ok) return

      assert.doesNotMatch(inspection.markdown, /signature=/)
      const media = inspection.document.content?.[0]?.content?.[0]
      assert.strictEqual(media?.type, nodeType)
      assert.strictEqual(media?.attrs?.src, canonical)
    })
  }
})

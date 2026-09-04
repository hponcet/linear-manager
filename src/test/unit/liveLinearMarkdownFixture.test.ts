import * as assert from "assert"
import { readFileSync } from "fs"
import { resolve } from "path"

import { inspectLinearMarkdown } from "../../webviews/components/Editor/linearMarkdown"

type DocumentNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>
  content?: DocumentNode[]
}

function nodes(node: DocumentNode, type: string): DocumentNode[] {
  return [
    ...(node.type === type ? [node] : []),
    ...(node.content?.flatMap((child) => nodes(child, type)) ?? []),
  ]
}

suite("anonymized live Linear Markdown contract", () => {
  test("preserves DES-538 fixture semantics", () => {
    const source = readFileSync(
      resolve(
        __dirname,
        "../../../src/test/fixtures/linearMarkdown/des-538-description.graphql.md",
      ),
      "utf8",
    ).trimEnd()
    const inspection = inspectLinearMarkdown(source)

    assert.strictEqual(
      inspection.ok,
      true,
      inspection.ok ? undefined : inspection.diagnostics[0]?.message,
    )
    if (!inspection.ok) return

    assert.strictEqual(nodes(inspection.document, "orderedList")[0]?.attrs?.start, 3)
    assert.deepStrictEqual(
      nodes(inspection.document, "taskItem").map((node) => node.attrs?.checked),
      [false, true, false],
    )

    const tableCells = nodes(inspection.document, "tableCell")
    assert.strictEqual(tableCells[2]?.content?.[0]?.content, undefined)
    assert.strictEqual(tableCells[1]?.content?.[0]?.content?.[0]?.marks?.[0]?.type, "bold")
    assert.strictEqual(tableCells[4]?.content?.[0]?.content?.[0]?.text, "a|b")
    assert.strictEqual(
      tableCells[5]?.content?.[0]?.content?.[0]?.marks?.[0]?.attrs?.href,
      "https://example.com/cell",
    )

    assert.strictEqual(
      nodes(inspection.document, "detailsSummary")[0]?.content?.[0]?.text,
      "Details title",
    )
    assert.deepStrictEqual(
      nodes(inspection.document, "codeBlock").map((node) => node.attrs?.language),
      ["typescript", "mermaid"],
    )

    const images = nodes(inspection.document, "image")
    assert.deepStrictEqual(
      images.map((node) => node.attrs?.alt),
      ["Remote image", "Data image", "Private image"],
    )
    assert.doesNotMatch(String(images[2]?.attrs?.src), /signature=/)

    const audio = nodes(inspection.document, "audio").find(
      (node) => node.attrs?.syntax === "linearEmbed",
    )
    const video = nodes(inspection.document, "video").find(
      (node) => node.attrs?.syntax === "linearEmbed",
    )
    assert.deepStrictEqual(
      [audio?.attrs?.title, audio?.attrs?.syntax],
      ["fixture-tone.mp3", "linearEmbed"],
    )
    assert.deepStrictEqual(
      [video?.attrs?.title, video?.attrs?.syntax],
      ["fixture-clip.mp4", "linearEmbed"],
    )
    assert.doesNotMatch(String(audio?.attrs?.src), /signature=/)
    assert.doesNotMatch(String(video?.attrs?.src), /signature=/)

    const mentions = nodes(inspection.document, "mention")
    assert.deepStrictEqual(
      mentions.map((node) => [node.attrs?.kind, node.attrs?.id, node.attrs?.notify]),
      [
        ["issue", "33333333-3333-4333-8333-333333333333", false],
        ["user", "11111111-1111-4111-8111-111111111111", false],
        ["issue", "EX-1", false],
      ],
    )

    const file = nodes(inspection.document, "linearFile")[0]
    assert.deepStrictEqual(
      [file?.attrs?.name, file?.attrs?.size, file?.attrs?.mimetype],
      ["fixture.png", 21504, "image/png"],
    )
    assert.doesNotMatch(String(file?.attrs?.href), /signature=/)
  })
})

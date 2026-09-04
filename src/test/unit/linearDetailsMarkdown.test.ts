import * as assert from "assert"

import { inspectLinearMarkdown } from "../../webviews/components/Editor/linearMarkdown"

type DocumentNode = { type?: string; content?: DocumentNode[] }

function countNodes(node: DocumentNode, type: string): number {
  return (
    Number(node.type === type) +
    (node.content?.reduce((sum, child) => sum + countNodes(child, type), 0) ?? 0)
  )
}

suite("Linear details Markdown", () => {
  test("parses issue-description delimiters and serializes them canonically", () => {
    const inspection = inspectLinearMarkdown(">>> More information\n\nInside details.\n\n>>>")

    assert.strictEqual(inspection.ok, true)
    if (!inspection.ok) return

    assert.strictEqual(countNodes(inspection.document, "details"), 1)
    assert.strictEqual(inspection.markdown, "+++ More information\n\nInside details.\n\n+++")
  })

  test("preserves Markdown syntax stored literally in a Linear details summary", () => {
    const source = ">>> ### **8. Minimal design**\n\nThe content remains editable.\n\n>>>"
    const inspection = inspectLinearMarkdown(source)

    assert.strictEqual(
      inspection.ok,
      true,
      inspection.ok ? undefined : inspection.diagnostics[0]?.message,
    )
    if (inspection.ok) {
      assert.strictEqual(
        inspection.markdown,
        "+++ ### **8. Minimal design**\n\nThe content remains editable.\n\n+++",
      )
    }
  })

  test("supports mixed nested delimiters and ignores delimiters in fenced code", () => {
    const source = [
      ">>> Outer",
      "",
      "```text",
      ">>> Not details",
      "+++",
      ">>>",
      "```",
      "",
      "+++ Inner",
      "",
      "Nested content.",
      "",
      "+++",
      "",
      ">>>",
    ].join("\n")
    const inspection = inspectLinearMarkdown(source)

    assert.strictEqual(
      inspection.ok,
      true,
      inspection.ok ? undefined : inspection.diagnostics[0]?.message,
    )
    if (!inspection.ok) return

    assert.strictEqual(countNodes(inspection.document, "details"), 2)
    assert.strictEqual(countNodes(inspection.document, "codeBlock"), 1)
  })

  for (const source of [
    ">>> Wrong close\n\nContent.\n\n+++",
    ">>> Outer\n\n+++ Inner\n\nContent.\n\n>>>\n\n+++",
    ">>>",
  ]) {
    test("rejects mismatched or unexpected delimiters", () => {
      const inspection = inspectLinearMarkdown(source)

      assert.strictEqual(inspection.ok, false)
      if (!inspection.ok) {
        assert.strictEqual(inspection.source, source)
        assert.ok(inspection.diagnostics.some(({ code }) => code === "malformed-details"))
      }
    })
  }
})

type SummaryNode = {
  type?: string
  attrs?: { level?: number | null }
  text?: string
  marks?: Array<{ type?: string }>
  content?: SummaryNode[]
}

function findSummary(node: SummaryNode): SummaryNode | undefined {
  if (node.type === "detailsSummary") return node
  for (const child of node.content ?? []) {
    const found = findSummary(child)
    if (found) return found
  }
  return undefined
}

suite("Linear details summary headings", () => {
  test("renders a heading summary as a heading and round-trips the marker", () => {
    // Linear writes `>>> ### **Title**`; the marker is block syntax, so inline tokenizing alone
    // left "### " visible as literal text in the summary.
    const source = ">>> ### **8. Formatted summary source**\n\nBody.\n\n>>>"
    const inspection = inspectLinearMarkdown(source)

    assert.strictEqual(inspection.ok, true)
    if (!inspection.ok) return

    const summary = findSummary(inspection.document as SummaryNode)
    assert.strictEqual(summary?.attrs?.level, 3, "the heading level is kept on the summary")
    assert.strictEqual(
      summary?.content?.[0]?.text,
      "8. Formatted summary source",
      "the marker is not part of the rendered text",
    )
    assert.strictEqual(summary?.content?.[0]?.marks?.[0]?.type, "bold")
    assert.strictEqual(
      inspection.markdown,
      "+++ ### **8. Formatted summary source**\n\nBody.\n\n+++",
    )
  })

  test("leaves a plain summary without a level", () => {
    const inspection = inspectLinearMarkdown(">>> Plain summary\n\nBody.\n\n>>>")
    assert.strictEqual(inspection.ok, true)
    if (!inspection.ok) return

    assert.strictEqual(findSummary(inspection.document as SummaryNode)?.attrs?.level ?? null, null)
    assert.strictEqual(inspection.markdown, "+++ Plain summary\n\nBody.\n\n+++")
  })
})

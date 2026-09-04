import * as assert from "assert"

import { Markdown, MarkdownManager } from "@tiptap/markdown"
import { StarterKit } from "@tiptap/starter-kit"

import { LinearFile } from "../../webviews/components/Editor/markdownPlugins/FilePlugin/LinearFile"
import {
  LinearOpaqueBlock,
  parseLinearOpaqueBlock,
  serializeLinearOpaqueBlock,
} from "../../webviews/components/Editor/markdownPlugins/LinearOpaqueBlock"

import type { JSONContent } from "@tiptap/core"

function findNode(node: JSONContent, type: string): JSONContent | undefined {
  return node.type === type
    ? node
    : node.content?.map((child) => findNode(child, type)).find(Boolean)
}

suite("Linear opaque blocks", () => {
  const manager = new MarkdownManager({
    extensions: [Markdown, StarterKit, LinearFile, LinearOpaqueBlock],
  })

  for (const [name, source, kind] of [
    ["HTML comment", "<!-- Solution considered -->", "html-comment"],
    [
      "Figma embed",
      '<linear-embed node-type="figma">{"href":"https://figma.com/file/one","title":"Design"}</linear-embed>',
      "figma",
    ],
    [
      "placeholder file",
      '<linear-embed node-type="file">{"uploadState":"finished","href":null,"name":"","size":0,"mimetype":null}</linear-embed>',
      "placeholder-file",
    ],
    [
      "legacy superscript",
      "\\[<sup>Archive one.zip\\]\n\\[</sup>Archive two.zip\\]",
      "legacy-superscript",
    ],
    [
      "canonical legacy superscript",
      "[<sup>Archive [one.zip](<http://one.zip>)]\n[</sup>Archive [two.zip](<http://two.zip>)]",
      "legacy-superscript",
    ],
  ] as const) {
    test(`preserves ${name} Markdown`, () => {
      const parsed = parseLinearOpaqueBlock(source)
      assert.strictEqual(parsed?.kind, kind)
      assert.strictEqual(parsed?.markdown, source)
      assert.strictEqual(serializeLinearOpaqueBlock(parsed), source)

      const document = manager.parse(source)
      assert.strictEqual(findNode(document, "linearOpaqueBlock")?.attrs?.kind, kind)
      assert.strictEqual(manager.serialize(document), source)
    })
  }

  test("never exposes unsafe Figma links", () => {
    const source =
      '<linear-embed node-type="figma">{"href":"command:workbench.action.openSettings","title":"Unsafe"}</linear-embed>'

    assert.strictEqual(parseLinearOpaqueBlock(source)?.href, null)
  })

  test("leaves valid file embeds to the existing file node", () => {
    const source =
      '<linear-embed node-type="file">{"uploadState":"finished","href":"https://uploads.linear.app/file","name":"report.pdf","size":1,"mimetype":"application/pdf"}</linear-embed>'

    assert.strictEqual(parseLinearOpaqueBlock(source), null)
    assert.ok(findNode(manager.parse(source), "linearFile"))
  })
})

import * as assert from "assert"

import { createLinearEditorCommands } from "../../webviews/components/Editor/markdownPlugins/SlashCommandPlugin/linearEditorCommands"

import type { Editor } from "@tiptap/core"

suite("linearEditorCommands", () => {
  test("provides the complete shared command registry and uses the current selection outside slash commands", () => {
    const ranges: Array<{ from: number; to: number }> = []
    const editor = { state: { selection: { from: 4, to: 7 } } } as Editor
    const commands = createLinearEditorCommands({
      pickDate: (_editor, range) => ranges.push(range),
      uploadFile: (_editor, range) => ranges.push(range),
    })

    assert.deepStrictEqual(
      commands.map(({ id }) => id),
      [
        "paragraph",
        "heading-1",
        "heading-2",
        "heading-3",
        "heading-4",
        "bullet-list",
        "ordered-list",
        "task-list",
        "blockquote",
        "code-block",
        "mermaid",
        "divider",
        "table",
        "details",
        "image",
        "date",
        "file",
      ],
    )

    commands.find(({ id }) => id === "date")?.run(editor)
    commands.find(({ id }) => id === "file")?.run(editor)
    assert.deepStrictEqual(ranges, [
      { from: 4, to: 7 },
      { from: 4, to: 7 },
    ])
  })
})

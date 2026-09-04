import "@tiptap/extension-table"

import type {} from "../DetailsPlugin/Details"
import type { Editor, Range } from "@tiptap/core"

export type LinearEditorCommand = {
  id: string
  label: string
  keywords: string[]
  run: (editor: Editor, range?: Range) => void
}

function runChain(editor: Editor, range: Range | undefined, command: (editor: Editor) => void) {
  const chain = editor.chain().focus()
  if (range) chain.deleteRange(range)
  chain.run()
  command(editor)
}

function selectedRange(editor: Editor): Range {
  return { from: editor.state.selection.from, to: editor.state.selection.to }
}

export function createLinearEditorCommands(options?: {
  pickDate?: (editor: Editor, range: Range) => void
  uploadFile?: (editor: Editor, range: Range) => void
}): LinearEditorCommand[] {
  return [
    {
      id: "paragraph",
      label: "Text",
      keywords: ["paragraph", "plain"],
      run: (editor, range) => runChain(editor, range, (current) => current.commands.setParagraph()),
    },
    ...([1, 2, 3, 4] as const).map(
      (level): LinearEditorCommand => ({
        id: `heading-${level}`,
        label: `Heading ${level}`,
        keywords: [`h${level}`, "title"],
        run: (editor, range) =>
          runChain(editor, range, (current) => current.commands.setHeading({ level })),
      }),
    ),
    {
      id: "bullet-list",
      label: "Bulleted list",
      keywords: ["unordered", "list"],
      run: (editor, range) =>
        runChain(editor, range, (current) => current.commands.toggleBulletList()),
    },
    {
      id: "ordered-list",
      label: "Numbered list",
      keywords: ["ordered", "list"],
      run: (editor, range) =>
        runChain(editor, range, (current) => current.commands.toggleOrderedList()),
    },
    {
      id: "task-list",
      label: "Checklist",
      keywords: ["todo", "task"],
      run: (editor, range) =>
        runChain(editor, range, (current) => current.commands.toggleTaskList()),
    },
    {
      id: "blockquote",
      label: "Quote",
      keywords: ["blockquote"],
      run: (editor, range) =>
        runChain(editor, range, (current) => current.commands.toggleBlockquote()),
    },
    {
      id: "code-block",
      label: "Code block",
      keywords: ["code", "fence"],
      run: (editor, range) => runChain(editor, range, (current) => current.commands.setCodeBlock()),
    },
    {
      id: "mermaid",
      label: "Diagram",
      keywords: ["mermaid", "graph"],
      run: (editor, range) =>
        runChain(editor, range, (current) =>
          current.commands.setCodeBlock({ language: "mermaid" }),
        ),
    },
    {
      id: "divider",
      label: "Divider",
      keywords: ["horizontal", "rule"],
      run: (editor, range) =>
        runChain(editor, range, (current) => current.commands.setHorizontalRule()),
    },
    {
      id: "table",
      label: "Table",
      keywords: ["grid", "rows", "columns"],
      run: (editor, range) =>
        runChain(editor, range, (current) =>
          current.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
        ),
    },
    {
      id: "details",
      label: "Collapsible section",
      keywords: ["details", "toggle"],
      run: (editor, range) => runChain(editor, range, (current) => current.commands.setDetails()),
    },
    {
      id: "image",
      label: "Image",
      keywords: ["upload", "picture"],
      run: (editor, range) =>
        runChain(editor, range, (current) =>
          current.commands.insertContent({ type: "imageUpload" }),
        ),
    },
    ...(options?.pickDate
      ? [
          {
            id: "date",
            label: "Date",
            keywords: ["calendar", "today"],
            run: (editor, range) => options.pickDate?.(editor, range ?? selectedRange(editor)),
          } satisfies LinearEditorCommand,
        ]
      : []),
    ...(options?.uploadFile
      ? [
          {
            id: "file",
            label: "File",
            keywords: ["attachment", "insert", "upload"],
            run: (editor, range) => options.uploadFile?.(editor, range ?? selectedRange(editor)),
          } satisfies LinearEditorCommand,
        ]
      : []),
  ]
}

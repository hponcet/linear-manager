import type { Editor } from "@tiptap/core"

export function setEditorEditable(editor: Pick<Editor, "setEditable">, editable: boolean): void {
  editor.setEditable(editable, false)
}

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

import { linearReferenceAttributes } from "./linearReferenceAttributes"

import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { EditorState } from "@tiptap/pm/state"

// Linear stores a plain mention as the handle alone, inside ordinary text. Decorating it
// instead of turning it into a node keeps marks such as bold working and leaves the saved
// Markdown untouched. The handle never contains whitespace and must start on a boundary so
// the local part of an email address is not mistaken for a mention.
const handlePattern = /@[A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9]/g
const boundaryPattern = /[\s([{<"'`‘“]/

export function findUserHandles(text: string): { from: number; to: number; label: string }[] {
  const handles: { from: number; to: number; label: string }[] = []
  handlePattern.lastIndex = 0
  let match = handlePattern.exec(text)

  while (match) {
    const previous = match.index === 0 ? undefined : text[match.index - 1]
    if (previous === undefined || boundaryPattern.test(previous)) {
      handles.push({
        from: match.index,
        to: match.index + match[0].length,
        label: match[0].slice(1),
      })
    }

    match = handlePattern.exec(text)
  }

  return handles
}

function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node, position) => {
    if (!node.isText || !node.text) {
      return
    }

    // A code mark is source text, never a mention.
    if (node.marks.some((mark) => mark.type.name === "code")) {
      return
    }

    findUserHandles(node.text).forEach((handle) => {
      decorations.push(
        Decoration.inline(position + handle.from, position + handle.to, {
          ...linearReferenceAttributes({ kind: "user", id: handle.label, label: handle.label }),
          class: "linear-reference linear-reference--handle",
        }),
      )
    })
  })

  return DecorationSet.create(doc, decorations)
}

export const LinearUserHandleDecoration = Extension.create({
  name: "linearUserHandleDecoration",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("linearUserHandleDecoration"),
        state: {
          init: (_config, state: EditorState) => buildDecorations(state.doc),
          apply: (transaction, value: DecorationSet, _oldState, newState) =>
            transaction.docChanged ? buildDecorations(newState.doc) : value,
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

import { Code } from "@tiptap/extension-code"
import { Plugin } from "@tiptap/pm/state"

function getInlineCodeAttributes(value: string): { delimiter: string; padding: string } {
  const longestRun = Math.max(0, ...[...value.matchAll(/`+/g)].map(([run]) => run.length))
  const delimiter = "`".repeat(longestRun + 1)
  const needsPadding =
    value.startsWith("`") ||
    value.endsWith("`") ||
    (value.startsWith(" ") && value.endsWith(" ") && /\S/.test(value))

  return { delimiter, padding: needsPadding ? " " : "" }
}

export function serializeLinearInlineCode(value: string): string {
  const { delimiter, padding } = getInlineCodeAttributes(value)
  return `${delimiter}${padding}${value}${padding}${delimiter}`
}

export const LinearInlineCode = Code.extend({
  addAttributes() {
    return {
      delimiter: { default: "`", rendered: false },
      padding: { default: "", rendered: false },
    }
  },

  parseMarkdown: (token, helpers) => {
    const text = token.text || ""
    return helpers.applyMark("code", [{ type: "text", text }], getInlineCodeAttributes(text))
  },

  renderMarkdown: (node, helpers) => {
    const delimiter =
      typeof node.attrs?.delimiter === "string" && /^`+$/.test(node.attrs.delimiter)
        ? node.attrs.delimiter
        : "`"
    const padding = node.attrs?.padding === " " ? " " : ""
    return `${delimiter}${padding}${helpers.renderChildren(node.content || [])}${padding}${delimiter}`
  },

  addProseMirrorPlugins() {
    const code = this.type

    return [
      new Plugin({
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged)) return null

          const transaction = newState.tr
          newState.doc.descendants((node, position) => {
            if (!node.isText || !node.text) return

            const mark = code.isInSet(node.marks)
            if (!mark) return

            const attributes = getInlineCodeAttributes(node.text)
            if (
              mark.attrs.delimiter === attributes.delimiter &&
              mark.attrs.padding === attributes.padding
            ) {
              return
            }

            transaction.removeMark(position, position + node.nodeSize, code)
            transaction.addMark(position, position + node.nodeSize, code.create(attributes))
          })

          return transaction.docChanged ? transaction : null
        },
      }),
    ]
  },
})

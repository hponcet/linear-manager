import { renderTableToMarkdown, Table, TableCell, TableHeader } from "@tiptap/extension-table"

export const LinearTableCell = TableCell.extend({ content: "paragraph" })
export const LinearTableHeader = TableHeader.extend({ content: "paragraph" })

function isEscaped(value: string, index: number): boolean {
  let backslashes = 0
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    backslashes += 1
  }
  return backslashes % 2 === 1
}

export function escapeLinearTableCellPipes(markdown: string): string {
  let result = ""
  let codeDelimiterLength = 0

  for (let index = 0; index < markdown.length; index += 1) {
    if (markdown[index] === "`" && !isEscaped(markdown, index)) {
      let length = 1
      while (markdown[index + length] === "`") length += 1
      if (codeDelimiterLength === 0) codeDelimiterLength = length
      else if (codeDelimiterLength === length) codeDelimiterLength = 0
      result += markdown.slice(index, index + length)
      index += length - 1
      continue
    }

    result += markdown[index] === "|" && codeDelimiterLength === 0 ? "\\|" : markdown[index]
  }

  return result
}

export const LinearTable = Table.extend({
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      "|": () => this.editor.isActive("table") && !this.editor.isActive("code"),
    }
  },

  renderMarkdown(node, helpers) {
    const renderChildren = helpers.renderChildren

    return renderTableToMarkdown(node, {
      ...helpers,
      renderChildren: (children, separator) =>
        escapeLinearTableCellPipes(renderChildren(children, separator)),
    })
  },
}).configure({ resizable: false })

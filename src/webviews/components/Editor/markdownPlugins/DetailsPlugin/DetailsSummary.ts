import { mergeAttributes, Node } from "@tiptap/core"

export interface DetailsSummaryOptions {
  /**
   * Custom HTML attributes that should be added to the rendered HTML tag.
   */
  HTMLAttributes: {
    [key: string]: any
  }
}

export const DetailsSummary = Node.create<DetailsSummaryOptions>({
  name: "detailsSummary",

  content: "inline*",

  // Linear allows a heading as the summary. The level is kept as an attribute so it survives the
  // round-trip and can style the summary, since a summary holds inline content only.
  addAttributes() {
    return {
      level: {
        default: null,
        parseHTML: (element) => {
          const level = Number(element.getAttribute("data-heading-level"))
          return Number.isInteger(level) && level >= 1 && level <= 6 ? level : null
        },
        renderHTML: (attributes) =>
          typeof attributes.level === "number" ? { "data-heading-level": attributes.level } : {},
      },
    }
  },

  defining: true,

  selectable: false,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: "summary",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  // A summary serialises to a single line after `+++ `, so a hard break inside it would push the
  // rest of the text into the details content on reparse and stall the round-trip save gate.
  addKeyboardShortcuts() {
    const inSummary = () => this.editor.state.selection.$head.parent.type === this.type
    return { "Shift-Enter": inSummary, "Mod-Enter": inSummary }
  },
})

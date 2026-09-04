import {
  defaultBlockAt,
  findChildren,
  findParentNode,
  isActive,
  mergeAttributes,
  Node,
} from "@tiptap/core"
import { Plugin, PluginKey, Selection, TextSelection } from "@tiptap/pm/state"

import { findClosestVisibleNode } from "../helpers/findClosestVisibleNode"
import { isNodeVisible } from "../helpers/isNodeVisible"
import { setGapCursor } from "../helpers/setGapCursor"

import type { ViewMutationRecord } from "@tiptap/pm/view"

export interface DetailsOptions {
  /**
   * Specify if the open status should be saved in the document. Defaults to `false`.
   */
  persist: boolean
  /**
   * Specifies a CSS class that is set when toggling the content. Defaults to `is-open`.
   */
  openClassName: string
  /**
   * Custom HTML attributes that should be added to the rendered HTML tag.
   */
  HTMLAttributes: {
    [key: string]: any
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    details: {
      /**
       * Set a details node
       */
      setDetails: () => ReturnType
      /**
       * Unset a details node
       */
      unsetDetails: () => ReturnType
    }
  }
}

export const Details = Node.create({
  name: "details",

  content: "detailsSummary detailsContent",

  group: "block",

  defining: true,

  isolating: true,

  allowGapCursor: false,

  addOptions() {
    return {
      persist: false,
      openClassName: "is-open",
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    if (!this.options.persist) {
      return []
    }

    return {
      open: {
        default: false,
        parseHTML: (element) => element.hasAttribute("open"),
        renderHTML: ({ open }) => {
          if (!open) {
            return {}
          }

          return { open: "" }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "details",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addNodeView() {
    return ({ editor, getPos, node, HTMLAttributes }) => {
      const dom = document.createElement("div")
      const attributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
        class: "details-container",
      })

      Object.entries(attributes).forEach(([key, value]) => dom.setAttribute(key, value))

      const toggle = document.createElement("button")
      toggle.className = "details-toggle-button"
      toggle.type = "button"

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      svg.setAttribute("width", "16")
      svg.setAttribute("height", "16")
      svg.setAttribute("aria-hidden", "true")
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
      path.setAttribute(
        "d",
        "M5.60633 11.8224C5.1159 12.1084 4.5 11.7547 4.5 11.1869V4.73676C4.5 4.16898 5.1159 3.81524 5.60633 4.10132L11.135 7.32638C11.6217 7.61025 11.6217 8.31338 11.135 8.59726L5.60633 11.8224Z",
      )
      svg.appendChild(path)
      toggle.appendChild(svg)

      dom.append(toggle)

      const content = document.createElement("div")
      content.className = "details-content-container"
      content.id = `details-content-${crypto.randomUUID()}`
      toggle.setAttribute("aria-controls", content.id)
      dom.append(content)

      const toggleDetailsContent = (setToValue?: boolean) => {
        const isOpen = dom.classList.contains(this.options.openClassName)
        const shouldOpen = setToValue ?? !isOpen

        toggle.setAttribute("aria-expanded", String(shouldOpen))
        toggle.setAttribute("aria-label", shouldOpen ? "Collapse details" : "Expand details")

        if (shouldOpen === isOpen) {
          return
        }

        dom.classList.toggle(this.options.openClassName, shouldOpen)

        const event = new Event("toggleDetailsContent")
        const detailsContent = content.querySelector(':scope > div[data-type="detailsContent"]')

        detailsContent?.dispatchEvent(event)
      }

      toggleDetailsContent(false)

      if (node.attrs.open) {
        setTimeout(() => toggleDetailsContent(true))
      }

      toggle.addEventListener("click", () => {
        toggleDetailsContent()

        if (!this.options.persist) {
          return
        }

        if (editor.isEditable && typeof getPos === "function") {
          const { from, to } = editor.state.selection

          editor
            .chain()
            .command(({ tr }) => {
              const pos = getPos()

              if (typeof pos !== "number") {
                return false
              }

              const currentNode = tr.doc.nodeAt(pos)

              if (currentNode?.type !== this.type) {
                return false
              }

              tr.setNodeMarkup(pos, undefined, {
                open: !currentNode.attrs.open,
              })

              return true
            })
            .setTextSelection({
              from,
              to,
            })
            .focus(undefined, { scrollIntoView: false })
            .run()
        }
      })

      return {
        dom,
        contentDOM: content,
        stopEvent: (event) => event.target instanceof Element && toggle.contains(event.target),
        ignoreMutation(mutation: ViewMutationRecord) {
          if (mutation.type === "selection") {
            return false
          }

          if (mutation.type === "attributes" && toggle.contains(mutation.target)) {
            return true
          }

          return !dom.contains(mutation.target) || dom === mutation.target
        },
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false
          }

          // Only update the open state if set
          if (this.options.persist && updatedNode.attrs.open !== undefined) {
            toggleDetailsContent(updatedNode.attrs.open)
          }

          return true
        },
      }
    }
  },

  addCommands() {
    return {
      setDetails:
        () =>
        ({ state, chain }) => {
          const { schema, selection } = state
          const { $from, $to } = selection
          const range = $from.blockRange($to)

          if (!range) {
            return false
          }

          const slice = state.doc.slice(range.start, range.end)
          const match = schema.nodes.detailsContent.contentMatch.matchFragment(slice.content)

          if (!match) {
            return false
          }

          const content = slice.toJSON()?.content || []

          return chain()
            .insertContentAt(
              { from: range.start, to: range.end },
              {
                type: this.name,
                content: [
                  {
                    type: "detailsSummary",
                  },
                  {
                    type: "detailsContent",
                    content,
                  },
                ],
              },
            )
            .setTextSelection(range.start + 2)
            .run()
        },

      unsetDetails:
        () =>
        ({ state, chain }) => {
          const { selection, schema } = state
          const details = findParentNode((node) => node.type === this.type)(selection)

          if (!details) {
            return false
          }

          const detailsSummaries = findChildren(
            details.node,
            (node) => node.type === schema.nodes.detailsSummary,
          )
          const detailsContents = findChildren(
            details.node,
            (node) => node.type === schema.nodes.detailsContent,
          )

          if (!detailsSummaries.length || !detailsContents.length) {
            return false
          }

          const detailsSummary = detailsSummaries[0]
          const detailsContent = detailsContents[0]
          const from = details.pos
          const $from = state.doc.resolve(from)
          const to = from + details.node.nodeSize
          const range = { from, to }
          const content = (detailsContent.node.content.toJSON() as []) || []
          const defaultTypeForSummary = $from.parent.type.contentMatch.defaultType

          // TODO: this may break for some custom schemas
          const summaryContent = defaultTypeForSummary
            ?.create(null, detailsSummary.node.content)
            .toJSON()
          const mergedContent = [summaryContent, ...content]

          return chain()
            .insertContentAt(range, mergedContent)
            .setTextSelection(from + 1)
            .run()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { schema, selection } = this.editor.state
        const { empty, $anchor } = selection

        if (!empty || $anchor.parent.type !== schema.nodes.detailsSummary) {
          return false
        }

        // for some reason safari removes the whole text content within a `<summary>`tag on backspace
        // so we have to remove the text manually
        // see: https://discuss.prosemirror.net/t/safari-backspace-bug-with-details-tag/4223
        if ($anchor.parentOffset !== 0) {
          return this.editor.commands.command(({ tr }) => {
            const from = $anchor.pos - 1
            const to = $anchor.pos

            tr.delete(from, to)

            return true
          })
        }

        return this.editor.commands.unsetDetails()
      },

      // Creates a new node below it if it is closed.
      // Otherwise inside `DetailsContent`.
      Enter: ({ editor }) => {
        const { state, view } = editor
        const { schema, selection } = state
        const { $head } = selection

        if ($head.parent.type !== schema.nodes.detailsSummary) {
          return false
        }

        const isVisible = isNodeVisible($head.after() + 1, editor)
        const above = isVisible ? state.doc.nodeAt($head.after()) : $head.node(-2)

        if (!above) {
          return false
        }

        const after = isVisible ? 0 : $head.indexAfter(-1)
        const type = defaultBlockAt(above.contentMatchAt(after))

        if (!type || !above.canReplaceWith(after, after, type)) {
          return false
        }

        const node = type.createAndFill()

        if (!node) {
          return false
        }

        const pos = isVisible ? $head.after() + 1 : $head.after(-1)
        const tr = state.tr.replaceWith(pos, pos, node)
        const $pos = tr.doc.resolve(pos)
        const newSelection = Selection.near($pos, 1)

        tr.setSelection(newSelection)
        tr.scrollIntoView()
        view.dispatch(tr)

        return true
      },

      // The default gapcursor implementation can’t handle hidden content, so we need to fix this.
      ArrowRight: ({ editor }) => {
        return setGapCursor(editor, "right")
      },

      // The default gapcursor implementation can’t handle hidden content, so we need to fix this.
      ArrowDown: ({ editor }) => {
        return setGapCursor(editor, "down")
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      // This plugin prevents text selections within the hidden content in `DetailsContent`.
      // The cursor is moved to the next visible position.
      new Plugin({
        key: new PluginKey("detailsSelection"),
        appendTransaction: (transactions, oldState, newState) => {
          const { editor, type } = this
          const isComposing = editor.view.composing

          if (isComposing) {
            return
          }

          const selectionSet = transactions.some((transaction) => transaction.selectionSet)

          if (!selectionSet || !oldState.selection.empty || !newState.selection.empty) {
            return
          }

          const detailsIsActive = isActive(newState, type.name)

          if (!detailsIsActive) {
            return
          }

          const { $from } = newState.selection
          const isVisible = isNodeVisible($from.pos, editor)

          if (isVisible) {
            return
          }

          const details = findClosestVisibleNode($from, (node) => node.type === type, editor)

          if (!details) {
            return
          }

          const detailsSummaries = findChildren(
            details.node,
            (node) => node.type === newState.schema.nodes.detailsSummary,
          )

          if (!detailsSummaries.length) {
            return
          }

          const detailsSummary = detailsSummaries[0]
          const selectionDirection =
            oldState.selection.from < newState.selection.from ? "forward" : "backward"
          const correctedPosition =
            selectionDirection === "forward"
              ? details.start + detailsSummary.pos
              : details.pos + detailsSummary.pos + detailsSummary.node.nodeSize
          const selection = TextSelection.create(newState.doc, correctedPosition)
          const transaction = newState.tr.setSelection(selection)

          return transaction
        },
      }),
    ]
  },

  markdownTokenizer: {
    name: "details",
    level: "block",
    start: (src) => src.match(/^(?:\+\+\+|>>>)[ \t]+[^\n]+\n/m)?.index ?? -1,
    tokenize(src, _tokens, lexer) {
      const openMatch = /^(\+\+\+|>>>)[ \t]+([^\n]+)\n/.exec(src)

      if (!openMatch) {
        return undefined
      }

      const delimiters = [openMatch[1]]
      let cursor = openMatch[0].length
      let fence: { marker: "`" | "~"; length: number } | null = null

      while (cursor <= src.length) {
        const newline = src.indexOf("\n", cursor)
        const lineEnd = newline === -1 ? src.length : newline
        const line = src.slice(cursor, lineEnd)
        const fenceMatch = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)

        if (fence) {
          if (
            fenceMatch?.[1]?.startsWith(fence.marker) &&
            fenceMatch[1].length >= fence.length &&
            !fenceMatch[2].trim()
          ) {
            fence = null
          }
        } else if (fenceMatch?.[1]) {
          fence = {
            marker: fenceMatch[1][0] as "`" | "~",
            length: fenceMatch[1].length,
          }
        } else {
          const nestedOpen = /^(\+\+\+|>>>)[ \t]+[^\n]+$/.exec(line)
          const close = /^(\+\+\+|>>>)$/.exec(line)

          if (nestedOpen) {
            delimiters.push(nestedOpen[1])
          } else if (close) {
            if (close[1] !== delimiters.at(-1)) {
              return undefined
            }

            delimiters.pop()
            if (delimiters.length === 0) {
              const rawEnd = newline === -1 ? lineEnd : newline + 1
              const content = src.slice(openMatch[0].length, cursor)

              // Linear lets a summary be a heading. The marker is block syntax, so the inline
              // lexer would leave "### " as literal text: strip it, remember the level, and put
              // it back when serialising.
              const summary = openMatch[2].trim()
              const heading = /^(#{1,6})\s+(.*)$/.exec(summary)

              return {
                type: "details",
                raw: src.slice(0, rawEnd),
                summaryLevel: heading ? heading[1].length : null,
                summaryTokens: lexer.inlineTokens(heading ? heading[2] : summary),
                tokens: lexer.blockTokens(content),
              }
            }
          }
        }

        if (newline === -1) {
          break
        }

        cursor = newline + 1
      }

      return undefined
    },
  },

  parseMarkdown: (token, h) => {
    return h.createNode("details", token.attributes, [
      h.createNode(
        "detailsSummary",
        { level: token.summaryLevel ?? null },
        h.parseInline(token.summaryTokens ?? []),
      ),
      h.createNode(
        "detailsContent",
        {},
        token.tokens?.length
          ? h.parseChildren(token.tokens || [])
          : [
              {
                type: "paragraph",
                content: [],
              },
            ],
      ),
    ])
  },

  renderMarkdown: (node, helpers) => {
    const summary = node.content?.find((child) => child.type === "detailsSummary")
    const summaryNode = summary?.content
    const summaryLevel = summary?.attrs?.level
    const summaryPrefix = typeof summaryLevel === "number" ? `${"#".repeat(summaryLevel)} ` : ""
    const summaryText = `${summaryPrefix}${summaryNode ? helpers.renderChildren(summaryNode) : ""}`

    const contentNode = node.content?.find((child) => child.type === "detailsContent")

    const contentText = contentNode?.content
      ? helpers.renderChildren(contentNode.content, "\n\n")
      : ""

    return `+++ ${summaryText}\n\n${contentText}\n\n+++`
  },
})

import { PluginKey } from "@tiptap/pm/state"
import { ReactNodeViewRenderer, ReactRenderer } from "@tiptap/react"

import { parseLinearMentionUrl } from "./LinearMention"
import { linearReferenceAttributes, referenceText } from "./linearReferenceAttributes"
import { LinearReferenceMention } from "./LinearReferenceMention"
import { LinearUserTagMention } from "./LinearUserTag"
import { MentionList, MentionListRef } from "./MentionList"
import {
  getMentionSuggestionAttributes,
  getMentionSuggestionItems,
  MentionSuggestionItem,
  MentionSuggestionOptions,
} from "./mentionSuggestions"

import type { Editor } from "@tiptap/core"
import type { SuggestionProps } from "@tiptap/suggestion"

export const UserMention = LinearUserTagMention

export function createUserMentionExtension(options: MentionSuggestionOptions) {
  const pluginKey = new PluginKey("linearMentionSuggestion")

  return UserMention.extend({
    addNodeView() {
      return ReactNodeViewRenderer(LinearReferenceMention, { as: "span" })
    },
  }).configure({
    HTMLAttributes: {
      class: "linear-user-mention",
    },
    renderText({ node }) {
      return referenceText(node.attrs.kind, node.attrs.label ?? node.attrs.id)
    },
    renderHTML({ node }) {
      const resourceUrl =
        typeof node.attrs.resourceUrl === "string"
          ? parseLinearMentionUrl(node.attrs.resourceUrl)?.resourceUrl
          : undefined
      const label = referenceText(node.attrs.kind, node.attrs.label ?? node.attrs.id)

      return [
        resourceUrl ? "a" : "span",
        {
          ...linearReferenceAttributes({
            kind: node.attrs.kind,
            id: node.attrs.id,
            label: node.attrs.label,
          }),
          "data-type": "mention",
          "data-resource-url": resourceUrl,
          "data-notify": node.attrs.notify === true ? "true" : undefined,
          href: resourceUrl,
          rel: resourceUrl ? "noopener noreferrer nofollow" : undefined,
        },
        ["span", { class: "linear-reference-icon", "aria-hidden": "true" }],
        ["span", { class: "linear-reference-label" }, label],
      ]
    },
    suggestion: {
      pluginKey,
      char: "@",
      allowSpaces: false,
      items: ({ query }) => getMentionSuggestionItems(query, options),
      command: ({ editor, range, props }) => {
        const item = props as MentionSuggestionItem

        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            {
              type: "mention",
              attrs: getMentionSuggestionAttributes(item),
            },
            {
              type: "text",
              text: " ",
            },
          ])
          .run()
      },
      render: () => {
        let component: ReactRenderer<MentionListRef> | null = null

        const isCurrent = (props: SuggestionProps<MentionSuggestionItem>) => {
          const state = pluginKey.getState(props.editor.state)
          return (
            !props.editor.isDestroyed &&
            state?.active === true &&
            state.query === props.query &&
            state.range.from === props.range.from &&
            state.range.to === props.range.to
          )
        }

        const updatePosition = (editor: Editor, clientRect?: (() => DOMRect | null) | null) => {
          const element = component?.element as HTMLElement | undefined
          const rect = clientRect?.()
          if (!element || !rect) {
            return
          }

          element.style.position = "fixed"
          element.style.left = `${rect.left}px`
          element.style.top = `${rect.bottom + 4}px`
          element.style.zIndex = "1000"
        }

        return {
          onStart: (props: SuggestionProps<MentionSuggestionItem>) => {
            if (!isCurrent(props)) return
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            })

            document.body.appendChild(component.element)
            updatePosition(props.editor, props.clientRect)
          },
          onUpdate: (props: SuggestionProps<MentionSuggestionItem>) => {
            if (!isCurrent(props)) return
            component?.updateProps(props)
            updatePosition(props.editor, props.clientRect)
          },
          onKeyDown: (props) => {
            if (props.event.key === "Escape") {
              return true
            }

            return component?.ref?.onKeyDown(props) ?? false
          },
          onExit: () => {
            component?.element.remove()
            component?.destroy()
            component = null
          },
        }
      },
    },
  })
}

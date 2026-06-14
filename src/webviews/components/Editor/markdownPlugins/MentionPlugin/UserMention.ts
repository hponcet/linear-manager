import { Mention } from "@tiptap/extension-mention"
import { ReactRenderer } from "@tiptap/react"
import { MentionableUser, filterMentionableUsers } from "src/utils/linearMentions"

import { MentionList, MentionListRef } from "./MentionList"

import type { Editor } from "@tiptap/core"
import type { SuggestionProps } from "@tiptap/suggestion"

export type MentionSuggestionItem = {
  id: string
  label: string
  profileUrl: string
  user: MentionableUser
}

function toMentionSuggestionItem(user: MentionableUser): MentionSuggestionItem {
  return {
    id: user.id,
    label: user.displayName,
    profileUrl: user.profileUrl || "",
    user,
  }
}

export const UserMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      profileUrl: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-profile-url"),
        renderHTML: (attributes) => {
          if (!attributes.profileUrl) {
            return {}
          }

          return {
            "data-profile-url": attributes.profileUrl,
          }
        },
      },
    }
  },

  renderMarkdown(node) {
    const profileUrl = node.attrs?.profileUrl
    if (typeof profileUrl === "string" && profileUrl.length > 0) {
      return profileUrl
    }

    const label = node.attrs?.label ?? node.attrs?.id
    return `@${label ?? ""}`
  },
})

export function createUserMentionExtension(options: {
  getUsers: () => MentionableUser[]
  getWorkspaceUrlKey: () => string | undefined
}) {
  return UserMention.configure({
    HTMLAttributes: {
      class: "linear-user-mention",
    },
    renderText({ node }) {
      return `@${node.attrs.label ?? node.attrs.id}`
    },
    renderHTML({ node }) {
      return [
        "span",
        {
          "data-type": "mention",
          "data-id": node.attrs.id,
          "data-label": node.attrs.label,
          "data-profile-url": node.attrs.profileUrl,
        },
        `@${node.attrs.label ?? node.attrs.id}`,
      ]
    },
    suggestion: {
      char: "@",
      allowSpaces: false,
      items: ({ query }) =>
        filterMentionableUsers(query, options.getUsers()).map(toMentionSuggestionItem),
      command: ({ editor, range, props }) => {
        const item = props as MentionSuggestionItem
        const workspaceUrlKey = options.getWorkspaceUrlKey()
        const profileUrl =
          item.profileUrl ||
          (workspaceUrlKey
            ? `https://linear.app/${workspaceUrlKey}/profiles/${encodeURIComponent(item.label)}`
            : "")

        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            {
              type: "mention",
              attrs: {
                id: item.id,
                label: item.label,
                profileUrl,
              },
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
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            })

            document.body.appendChild(component.element)
            updatePosition(props.editor, props.clientRect)
          },
          onUpdate: (props: SuggestionProps<MentionSuggestionItem>) => {
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

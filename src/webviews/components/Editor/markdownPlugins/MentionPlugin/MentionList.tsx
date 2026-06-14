import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { SerializedUser } from "src/types/SerializedLinear"
import { UserAvatar } from "src/webviews/components/UserAvatar/UserAvatar"

import { MentionSuggestionItem } from "./UserMention"

import type { SuggestionKeyDownProps } from "@tiptap/suggestion"

import "./MentionList.scss"

export type MentionListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

type MentionListProps = {
  items: MentionSuggestionItem[]
  command: (item: MentionSuggestionItem) => void
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const { items, command } = props
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((current) => (current + items.length - 1) % items.length)
        return true
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((current) => (current + 1) % items.length)
        return true
      }

      if (event.key === "Enter") {
        const item = items[selectedIndex]
        if (item) {
          command(item)
        }
        return true
      }

      return false
    },
  }))

  if (items.length === 0) {
    return (
      <div className="mentionList">
        <div className="mentionListEmpty">No users found</div>
      </div>
    )
  }

  return (
    <div className="mentionList">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={`mentionListItem${index === selectedIndex ? " is-selected" : ""}`}
          onMouseEnter={() => setSelectedIndex(index)}
          onMouseDown={(event) => {
            event.preventDefault()
            command(item)
          }}
        >
          <UserAvatar user={item.user as SerializedUser} size={20} />
          <span className="mentionListItemLabel">{item.user.displayName}</span>
          <span className="mentionListItemMeta">{item.user.name}</span>
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = "MentionList"

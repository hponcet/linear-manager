import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { SerializedUser } from "src/types/SerializedLinear"
import { UserAvatar } from "src/webviews/components/UserAvatar/UserAvatar"
import { WorkflowStateIcon } from "src/webviews/components/WorklfowStatePicker/WorkflowStateIcon"

import { LinearReferenceIcon } from "./LinearReferenceIcon"
import { MentionSuggestionItem } from "./mentionSuggestions"

import type { SuggestionKeyDownProps } from "@tiptap/suggestion"

import "./MentionList.scss"

export type MentionListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

type MentionListProps = {
  items: MentionSuggestionItem[]
  command: (item: MentionSuggestionItem) => void
}

// Linear groups its mention menu by entity, in this order.
const GROUPS: { kind: MentionSuggestionItem["kind"]; title: string }[] = [
  { kind: "user", title: "Users" },
  { kind: "issue", title: "Issues" },
  { kind: "project", title: "Projects" },
  { kind: "document", title: "Documents" },
  { kind: "cycle", title: "Cycles" },
  { kind: "milestone", title: "Milestones" },
  { kind: "view", title: "Views" },
  { kind: "initiative", title: "Initiatives" },
]

function MentionRow(props: { item: MentionSuggestionItem }) {
  const { item } = props

  if (item.kind === "user") {
    return (
      <>
        <UserAvatar user={item.user as SerializedUser} size={18} />
        <span className="mentionListItemLabel">{item.label}</span>
        {item.description && item.description !== item.label ? (
          <span className="mentionListItemMeta">{item.description}</span>
        ) : null}
      </>
    )
  }

  if (item.kind === "issue") {
    return (
      <>
        <span className="mentionListItemIcon" aria-hidden="true">
          {item.workflowState ? (
            <WorkflowStateIcon workflowState={item.workflowState} size={14} />
          ) : (
            <LinearReferenceIcon kind={item.kind} card={null} />
          )}
        </span>
        <span className="mentionListItemIdentifier">{item.label}</span>
        <span className="mentionListItemTitle">{item.description}</span>
      </>
    )
  }

  return (
    <>
      <span className="mentionListItemIcon" aria-hidden="true">
        <LinearReferenceIcon kind={item.kind} card={null} />
      </span>
      <span className="mentionListItemLabel">{item.label}</span>
      {item.description ? <span className="mentionListItemTitle">{item.description}</span> : null}
    </>
  )
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const { items, command } = props
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) {
        return false
      }

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
      <div className="mentionList" role="listbox" aria-label="Linear mentions">
        <div className="mentionListEmpty" role="status">
          No mentions found
        </div>
      </div>
    )
  }

  // Keyboard navigation walks the flat list, so each row keeps its original index.
  const groups = GROUPS.map((group) => ({
    ...group,
    entries: items.flatMap((item, index) => (item.kind === group.kind ? [{ item, index }] : [])),
  })).filter((group) => group.entries.length)

  return (
    <div className="mentionList" role="listbox" aria-label="Linear mentions">
      {groups.map((group) => (
        <div className="mentionListGroup" key={group.kind}>
          <div className="mentionListGroupTitle" aria-hidden="true">
            {group.title}
          </div>
          {group.entries.map(({ item, index }) => (
            <button
              key={`${item.kind}:${item.id}`}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={`mentionListItem${index === selectedIndex ? " is-selected" : ""}`}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                command(item)
              }}
            >
              <MentionRow item={item} />
            </button>
          ))}
        </div>
      ))}
    </div>
  )
})

MentionList.displayName = "MentionList"

import { ProjectCycleIcon } from "src/webviews/components/ProjectCyclePicker/ProjectCycleIcon"
import { ProjectIcon } from "src/webviews/components/ProjectPicker/ProjectIcon"
import { WorkflowStateIcon } from "src/webviews/components/WorklfowStatePicker/WorkflowStateIcon"

import type { LinearReferenceCard } from "src/linear/LinearService"

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u
const ICON_SIZE = 13

/**
 * The icon slot of a reference chip. It reuses the icons the rest of the extension already
 * draws — the workflow-state glyph for an issue, the project and cycle glyphs — so a
 * reference looks the same inline as in the sidebar and the pickers. Linear's own named
 * icons belong to its icon font, so an entity that has no emoji falls back to the kind
 * glyph tinted with its colour.
 */
export function LinearReferenceIcon(props: { kind: string; card: LinearReferenceCard | null }) {
  const { kind, card } = props

  if (kind === "issue" && card?.workflowState) {
    return (
      <span className="linear-reference-icon linear-reference-icon--svg" aria-hidden="true">
        <WorkflowStateIcon workflowState={card.workflowState} size={ICON_SIZE} />
      </span>
    )
  }

  if (card?.icon && EMOJI_PATTERN.test(card.icon)) {
    return (
      <span className="linear-reference-icon linear-reference-icon--emoji" aria-hidden="true">
        {card.icon}
      </span>
    )
  }

  if (kind === "project") {
    return (
      <span className="linear-reference-icon linear-reference-icon--svg" aria-hidden="true">
        <ProjectIcon size={ICON_SIZE} color={card?.color || "currentColor"} />
      </span>
    )
  }

  if (kind === "cycle") {
    return (
      <span
        className="linear-reference-icon linear-reference-icon--svg linear-reference-icon--cycle"
        aria-hidden="true"
      >
        <ProjectCycleIcon size={ICON_SIZE} />
      </span>
    )
  }

  return (
    <span
      className="linear-reference-icon"
      data-kind={kind}
      aria-hidden="true"
      style={card?.color ? { backgroundColor: card.color } : undefined}
    />
  )
}

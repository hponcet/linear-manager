import { SerializedWorkflowState } from "src/types/SerializedLinear"

import { WorkflowStateIcon } from "./WorkflowStateIcon"

export type WorkflowStateProps = {
  style?: React.CSSProperties
  className?: string
  workflowState?: SerializedWorkflowState
  inline?: "text" | "icon"
  size?: number
}

export function WorkflowState(props: WorkflowStateProps) {
  const { style, className, workflowState, inline, size } = props

  if (!workflowState) {
    return "Unknown state"
  }

  if (inline === "text") {
    return workflowState.name
  }

  if (inline === "icon") {
    return (
      <WorkflowStateIcon
        style={style}
        className={className}
        workflowState={workflowState}
        size={size}
      />
    )
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        whiteSpace: "nowrap",
        fontSize: size,
        ...style,
      }}
      className={className}
    >
      <WorkflowStateIcon style={{ marginRight: 8 }} workflowState={workflowState} size={size} />
      <span>{workflowState.name}</span>
    </div>
  )
}

import { WorkflowStateIcon } from "./WorkflowStateIcon";
import { WorkflowStateWithStateProgress } from "src/types/Linear";

export type WorkflowStateProps = {
  style?: React.CSSProperties;
  className?: string;
  workflowState?: WorkflowStateWithStateProgress;
  inline?: "text" | "icon";
};

export function WorkflowState(props: WorkflowStateProps) {
  const { style, className, workflowState, inline } = props;

  if (!workflowState) {
    return "Unknown state";
  }

  if (inline === "text") {
    return workflowState.name;
  }

  if (inline === "icon") {
    return (
      <WorkflowStateIcon
        style={style}
        className={className}
        workflowState={workflowState}
      />
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        whiteSpace: "nowrap",
        ...style,
      }}
      className={className}
    >
      <WorkflowStateIcon
        style={{ marginRight: 8 }}
        workflowState={workflowState}
      />
      <span>{workflowState.name}</span>
    </div>
  );
}

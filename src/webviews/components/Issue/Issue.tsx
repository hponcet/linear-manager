import { SerializedIssue } from "src/types/SerializedLinear"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { WorkflowStateIcon } from "../WorklfowStatePicker/WorkflowStateIcon"

import "./Issue.scss"

type IssueProps = {
  issue: SerializedIssue
}

export function Issue(props: IssueProps) {
  const { issue } = props

  const { workflowStates, update } = useIssueContext()

  const workflowState = workflowStates.find((ws) => ws.id === issue.stateId)

  return (
    <div className="issueContainer" onClick={() => update.panelActions.openIssue(issue.id)}>
      {workflowState ? <WorkflowStateIcon workflowState={workflowState} size={12} /> : null}
      <div className="issueIdentifier">{issue.identifier}</div>
      <div className="issueTitle">{issue.title}</div>
    </div>
  )
}

import { Issue as LinearIssue } from "@linear/sdk";
import { WorkflowStateIcon } from "../WorklfowStatePicker/WorkflowStateIcon";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

import "./Issue.scss";

type IssueProps = {
  issue: LinearIssue;
};

export function Issue(props: IssueProps) {
  const { issue } = props;

  const { workflowStates, update } = useIssueContext();

  const workflowState = workflowStates.find((ws) => ws.id === issue.stateId);

  return (
    <div
      className="issueContainer"
      onClick={() => update.panelActions.openIssue(issue.id)}
    >
      {workflowState ? (
        <WorkflowStateIcon workflowState={workflowState} size={12} />
      ) : null}
      <div className="issueIdentifier">{issue.identifier}</div>
      <div className="issueTitle">{issue.title}</div>
    </div>
  );
}

import { Issue as LinearIssue } from "@linear/sdk";

import "./Issue.scss";
import { WorkflowStateIcon } from "../WorklfowStatePicker/WorkflowStateIcon";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { panelActions } from "src/webviews/utils/vscMessaging";

type IssueProps = {
  issue: LinearIssue;
};

export function Issue(props: IssueProps) {
  const { issue } = props;

  const { workflowStates } = useIssueContext();

  const workflowState = workflowStates.find((ws) => ws.id === issue.stateId);

  return (
    <div
      className="issueContainer"
      onClick={() => {
        panelActions.openIssue(issue.id);
      }}
    >
      {workflowState ? (
        <WorkflowStateIcon workflowState={workflowState} size={12} />
      ) : null}
      <div className="issueIdentifier">{issue.identifier}</div>
      <div className="issueTitle">{issue.title}</div>
    </div>
  );
}

import { Issue } from "@linear/sdk";

import { WorkflowStatePicker } from "../WorklfowStatePicker/WorkflowStatePicker";
import { AssigneePicker } from "../Assignee/AssigneePicker";
import { ProjectCyclePicker } from "../ProjectCyclePicker/ProjectCyclePicker";
import { IssueProjectPicker } from "../ProjectPicker/ProjectPicker";
import { PriorityPicker } from "../PriorityPicker/PriorityPicker";
import { EstimatePicker } from "../EstimatePicker/EstimatePicker";

import { useIssueContext } from "src/webviews/contexts/IssueContext";

import "./InlineIssue.scss";

export type InlineIssueProps = {
  issue: Issue;
  className?: string;
  style?: React.CSSProperties;
};

export function InlineIssue(props: InlineIssueProps) {
  const { issue, className, style } = props;

  const { update } = useIssueContext();

  return (
    <div className={`inlineIssueContainer ${className || ""}`} style={style}>
      <div className="inlineIssueTitleContainer">
        <span
          className="inlineIssueIdentifier"
          onClick={() => update.panelActions.openIssue(issue.id)}
        >
          {issue.identifier}
        </span>
        <WorkflowStatePicker
          issue={issue}
          onChange={(stateId) => update.issue(issue.id, { stateId })}
          inline="icon"
        />
        <span
          className="inlineIssueTitle"
          style={{ paddingLeft: 3 }}
          onClick={() => update.panelActions.openIssue(issue.id)}
        >
          {issue.title}
        </span>
      </div>
      <div className="inlineIssueActions">
        <PriorityPicker
          issue={issue}
          inline="icon"
          placement="bottomEnd"
          onChange={(priority) => update.issue(issue.id, { priority })}
          size={14}
        />
        <EstimatePicker
          issue={issue}
          inline="icon"
          placement="bottomEnd"
          onChange={(estimate) => update.issue(issue.id, { estimate })}
          size={14}
        />
        <IssueProjectPicker
          issue={issue}
          inline="icon"
          placement="bottomEnd"
          onChange={(projectId) => update.issue(issue.id, { projectId })}
          size={14}
        />
        <ProjectCyclePicker
          issue={issue}
          inline="icon"
          placement="bottomEnd"
          onChange={(cycleId) => update.issue(issue.id, { cycleId })}
          size={14}
        />
        <AssigneePicker
          issue={issue}
          inline="icon"
          placement="bottomEnd"
          onChange={(assigneeId) => update.issue(issue.id, { assigneeId })}
          size={14}
        />
      </div>
    </div>
  );
}

import { Issue } from "@linear/sdk";

import { WorkflowStatePicker } from "../WorklfowStatePicker/WorkflowStatePicker";
import { AssigneePicker } from "../Assignee/AssigneePicker";
import { ProjectCyclePicker } from "../ProjectCyclePicker/ProjectCyclePicker";
import { IssueProjectPicker } from "../ProjectPicker/ProjectPicker";
import { PriorityPicker } from "../PriorityPicker/PriorityPicker";
import { EstimatePicker } from "../EstimatePicker/EstimatePicker";

import { panelActions } from "src/webviews/utils/vscMessaging";

import "./InlineIssue.scss";

export type InlineIssueProps = {
  issue: Issue;
  className?: string;
  style?: React.CSSProperties;
};

export function InlineIssue(props: InlineIssueProps) {
  const { issue, className, style } = props;

  return (
    <div className={`inlineIssueContainer ${className || ""}`} style={style}>
      <div className="inlineIssueTitleContainer">
        <span
          className="inlineIssueIdentifier"
          onClick={() => panelActions.openIssue(issue.id)}
        >
          {issue.identifier}
        </span>
        <WorkflowStatePicker issue={issue} inline="icon" />
        <span
          className="inlineIssueTitle"
          style={{ paddingLeft: 3 }}
          onClick={() => panelActions.openIssue(issue.id)}
        >
          {issue.title}
        </span>
      </div>
      <div className="inlineIssueActions">
        <PriorityPicker issue={issue} inline="icon" placement="bottomEnd" />
        <EstimatePicker issue={issue} inline="icon" placement="bottomEnd" />
        <IssueProjectPicker issue={issue} inline="icon" placement="bottomEnd" />
        <ProjectCyclePicker issue={issue} inline="icon" placement="bottomEnd" />
        <AssigneePicker issue={issue} inline="icon" placement="bottomEnd" />
      </div>
    </div>
  );
}

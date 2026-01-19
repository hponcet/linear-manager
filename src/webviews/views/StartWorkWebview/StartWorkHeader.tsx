import { PriorityPicker } from "src/webviews/components/PriorityPicker/PriorityPicker";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { AssigneePicker } from "src/webviews/components/Assignee/AssigneePicker";
import { EstimatePicker } from "src/webviews/components/EstimatePicker/EstimatePicker";
import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker";
import { Ref } from "src/types/GitAPI";
import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker";

import "./StartWorkHeader.scss";

export type StartWorkHeaderProps = {
  branches?: Ref[];
  currentBranch?: Ref | null;
};

export function StartWorkHeader(props: StartWorkHeaderProps) {
  const { issue, update } = useIssueContext();

  return (
    <div className="startWorkContentTitle">
      <span>
        <span className="startWorkContentIdentifier">
          <WorkflowStatePicker
            issue={issue}
            onChange={(stateId) => update.issue(issue.id, { stateId })}
            inline="icon"
            size={14}
          />
          <span onClick={() => update.panelActions.openIssue(issue.id)}>
            {issue.identifier}
          </span>
        </span>
        <span onClick={() => update.panelActions.openIssue(issue.id)}>
          {issue?.title}
        </span>
      </span>

      <span className="startWorkContentLeftActions">
        <PriorityPicker
          issue={issue}
          size={14}
          inline="icon"
          onChange={(priority) => update.issue(issue.id, { priority })}
          placement="bottomEnd"
        />
        <EstimatePicker
          issue={issue}
          size={14}
          inline="icon"
          onChange={(estimate) => update.issue(issue.id, { estimate })}
          placement="bottomEnd"
        />
        <ProjectCyclePicker
          issue={issue}
          size={14}
          inline="icon"
          onChange={(cycleId) => update.issue(issue.id, { cycleId })}
          placement="bottomEnd"
        />
        <AssigneePicker
          issue={issue}
          inline="icon"
          size={14}
          onChange={(assigneeId) => update.issue(issue.id, { assigneeId })}
          placement="bottomEnd"
        />
      </span>
    </div>
  );
}

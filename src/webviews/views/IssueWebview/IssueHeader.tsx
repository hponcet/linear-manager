import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker";
import { LabelsPicker } from "src/webviews/components/LabelsPicker/LabelsPicker";
import { PriorityPicker } from "src/webviews/components/PriorityPicker/PriorityPicker";
import { EstimatePicker } from "src/webviews/components/EstimatePicker/EstimatePicker";
import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker";
import { IssueProjectPicker } from "src/webviews/components/ProjectPicker/ProjectPicker";
import { AssigneePicker } from "src/webviews/components/Assignee/AssigneePicker";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { StartWorkButton } from "src/webviews/components/StartWorkButton/StartWorkButton";
import { OpenExternalIssue } from "src/webviews/components/OpenExternalIssue/OpenExternalIssue";

import "./IssueHeader.css";
import { TrashIcon } from "src/webviews/components/Icons/TrashIcon";

export function IssueHeader() {
  const { issue, update } = useIssueContext();

  return (
    <>
      <div className="issueHeaderTopRow">
        {issue.trashed && (
          <span className="issueTrashedLabel">
            <TrashIcon /> Trashed
          </span>
        )}

        <WorkflowStatePicker
          issue={issue}
          onChange={(stateId) => update.issue(issue.id, { stateId })}
          style={{ marginLeft: 6 }}
          size={14}
          disabled={!!issue.trashed}
        />
        <PriorityPicker
          issue={issue}
          onChange={(priority) => update.issue(issue.id, { priority })}
          style={{ marginLeft: 6 }}
          size={14}
          disabled={!!issue.trashed}
        />
        <EstimatePicker
          issue={issue}
          onChange={(estimate) => update.issue(issue.id, { estimate })}
          style={{ marginLeft: 6 }}
          size={14}
          disabled={!!issue.trashed}
        />
        <ProjectCyclePicker
          issue={issue}
          onChange={(cycleId) => update.issue(issue.id, { cycleId })}
          style={{ marginLeft: 6 }}
          size={14}
          disabled={!!issue.trashed}
        />
        <IssueProjectPicker
          issue={issue}
          onChange={(projectId) => update.issue(issue.id, { projectId })}
          style={{ marginLeft: 6 }}
          size={14}
          placement="bottom"
          disabled={!!issue.trashed}
        />
        <div className="issueHeaderBottomRow" style={{ marginLeft: "auto" }}>
          <AssigneePicker
            issue={issue}
            onChange={(assigneeId) => update.issue(issue.id, { assigneeId })}
            style={{ marginLeft: 6 }}
            size={14}
            placement="bottomEnd"
            inline="icon"
            disabled={!!issue.trashed}
          />
          {!issue.trashed && <StartWorkButton issue={issue} />}
          <OpenExternalIssue issue={issue} style={{ marginLeft: 6 }} />
        </div>
      </div>
      <LabelsPicker
        issue={issue}
        onChange={(labelIds) => update.issue(issue.id, { labelIds })}
        style={{ marginTop: 6 }}
        size={14}
        disabled={!!issue.trashed}
      />
    </>
  );
}

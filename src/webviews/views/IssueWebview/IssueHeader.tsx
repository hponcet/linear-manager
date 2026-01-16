import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker";
import { LabelsPicker } from "src/webviews/components/LabelsPicker/LabelsPicker";
import { PriorityPicker } from "src/webviews/components/PriorityPicker/PriorityPicker";
import { EstimatePicker } from "src/webviews/components/EstimatePicker/EstimatePicker";

import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker";
import { IssueProjectPicker } from "src/webviews/components/ProjectPicker/ProjectPicker";

import { AssigneePicker } from "src/webviews/components/Assignee/AssigneePicker";

import "./IssueHeader.css";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

export function IssueHeader() {
  const { issue } = useIssueContext();

  return (
    <>
      <div className="issueHeaderTopRow">
        <WorkflowStatePicker issue={issue} style={{ marginLeft: 6 }} />
        <PriorityPicker issue={issue} style={{ marginLeft: 6 }} />
        <EstimatePicker issue={issue} style={{ marginLeft: 6 }} />
        <ProjectCyclePicker issue={issue} style={{ marginLeft: 6 }} />
        <IssueProjectPicker
          issue={issue}
          style={{ marginLeft: 6 }}
          placement="bottom"
        />
        <AssigneePicker
          issue={issue}
          style={{ marginLeft: 6 }}
          placement="bottomEnd"
        />
      </div>
      <LabelsPicker issue={issue} style={{ marginTop: 6 }} />
    </>
  );
}

import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker";
import { LabelPicker } from "src/webviews/components/Labels/LabelPicker";
import { PriorityPicker } from "src/webviews/components/PriorityPicker/PriorityPicker";
import { EstimatePicker } from "src/webviews/components/EstimatePicker/EstimatePicker";

import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker";
import { IssueProjectPicker } from "src/webviews/components/ProjectPicker/ProjectPicker";

import { AssigneePicker } from "src/webviews/components/Assignee/AssigneePicker";

import "./IssueHeader.css";

export function IssueHeader() {
  return (
    <>
      <div className="issueHeaderTopRow">
        <WorkflowStatePicker style={{ marginLeft: 6 }} />
        <PriorityPicker style={{ marginLeft: 6 }} />
        <EstimatePicker style={{ marginLeft: 6 }} />
        <ProjectCyclePicker style={{ marginLeft: 6 }} />
        <IssueProjectPicker style={{ marginLeft: 6 }} />
        <AssigneePicker style={{ marginLeft: 6 }} />
      </div>
      <LabelPicker style={{ marginTop: 6 }} />
    </>
  );
}

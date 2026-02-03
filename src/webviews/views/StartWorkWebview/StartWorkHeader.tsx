import { PriorityPicker } from "src/webviews/components/PriorityPicker/PriorityPicker";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { AssigneePicker } from "src/webviews/components/Assignee/AssigneePicker";
import { EstimatePicker } from "src/webviews/components/EstimatePicker/EstimatePicker";
import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker";
import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker";
import { Menu } from "src/webviews/components/Menu/Menu";
import { OpenExternalIcon } from "src/webviews/components/Icons/OpenExternalIcon";
import { ResetIcon } from "src/webviews/components/Icons/ResetIcon";

import "./StartWorkHeader.scss";
import { CogIcon } from "src/webviews/components/Icons/CogIcon";
import { LabelsPicker } from "src/webviews/components/LabelsPicker/LabelsPicker";
import { useIssueSettings } from "src/webviews/hooks/useIssueSettings";

export type StartWorkHeaderProps = {
  setBranchNamingSettingsOpen: (open: boolean) => void;
};

export function StartWorkHeader(props: StartWorkHeaderProps) {
  const { setBranchNamingSettingsOpen } = props;

  const { issue, update } = useIssueContext();

  const { updateIssueSettings } = useIssueSettings({ issueId: issue.id });

  return (
    <div className="startWorkHeader">
      <div className="startWorkContentTitle">
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
      </div>
      <div className="startWorkContentActions">
        <LabelsPicker
          issue={issue}
          onChange={(labelIds) => update.issue(issue.id, { labelIds })}
          style={{ marginTop: 6 }}
          size={11}
          disabled={!!issue.trashed}
        />

        <div className="startWorkContentLeftActions">
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
          <Menu
            items={[
              {
                label: "Open in Linear",
                action: () => update.panelActions.openExternal(),
                icon: <OpenExternalIcon size={14} />,
              },
              {
                label: "Reset branch settings",
                action: () =>
                  updateIssueSettings({
                    branch: undefined,
                    branchInitialized: false,
                    ignoredBranches: [],
                  }),
                icon: <ResetIcon size={14} />,
              },
              {
                label: "Branch naming settings",
                action: () => setBranchNamingSettingsOpen(true),
                icon: <CogIcon size={14} />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

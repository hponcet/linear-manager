import { PriorityPicker } from "src/webviews/components/PriorityPicker/PriorityPicker";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { AssigneePicker } from "src/webviews/components/Assignee/AssigneePicker";
import { EstimatePicker } from "src/webviews/components/EstimatePicker/EstimatePicker";
import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker";
import { Ref } from "src/types/GitAPI";
import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker";

import { Menu } from "src/webviews/components/Menu/Menu";

import "./StartWorkHeader.scss";
import { useVSCState } from "src/webviews/hooks/useVSCState";
import { IssueVscState, VscStateKeys } from "src/vscStates";
import { OpenExternalIcon } from "src/webviews/components/Icons/OpenExternalIcon";
import { ResetIcon } from "src/webviews/components/Icons/ResetIcon";

export type StartWorkHeaderProps = {
  branches?: Ref[];
  currentBranch?: Ref | null;
};

export function StartWorkHeader(props: StartWorkHeaderProps) {
  const { issue, update } = useIssueContext();

  const [, setIssueSettings] = useVSCState<IssueVscState>(
    VscStateKeys.issueSettings,
    {},
  );

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
                setIssueSettings((s) => ({
                  ...s,
                  [issue.id]: {
                    branch: undefined,
                    branchInitialized: false,
                    ignoredBranches: [],
                  },
                })),
              icon: <ResetIcon size={14} />,
            },
          ]}
        />
      </span>
    </div>
  );
}

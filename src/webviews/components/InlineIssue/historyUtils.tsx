import { IssueHistory, IssueLabel } from "@linear/sdk";
import { ReactNode } from "react";
import { IssueContextValueData } from "src/webviews/contexts/IssueContext";
import { Label } from "../LabelsPicker/Label";
import moment from "moment";
import { Priority } from "../PriorityPicker/Priority";
import { ProjectCycle } from "../ProjectCyclePicker/ProjectCycle";
import { Project } from "../ProjectPicker/Project";
import { WorkflowState } from "../WorklfowStatePicker/WorkflowState";
import { Estimate } from "../EstimatePicker/Estimate";
import { Assignee } from "../Assignee/Assignee";
import { ProjectCycleIcon } from "../ProjectCyclePicker/ProjectCycleIcon";
import { EstimateIcon } from "../EstimatePicker/EstimateIcon";
import { PriorityIcon } from "../PriorityPicker/PriorityIcon";
import { ProjectIcon } from "../ProjectPicker/ProjectIcon";
import { WorkflowStateIcon } from "../WorklfowStatePicker/WorkflowStateIcon";
import { LabelIcon } from "../LabelsPicker/LabelIcon";
import { LinkIcon } from "../Icons/LinkIcon";

const historyFieldsOfInterest = [
  "addedLabels",
  "attachmentId",
  "autoArchived",
  "autoClosed",
  "customerNeedId",
  "descriptionUpdatedBy",
  "fromAssigneeId",
  "fromCycleId",
  "fromDueDate",
  "fromEstimate",
  "fromParentId",
  "fromPriority",
  "fromProjectId",
  "fromStateId",
  "fromTeamId",
  "fromTitle",
  "issueImport",
  "relationChanges",
  "removedLabels",
  "toAssigneeId",
  "toConvertedProjectId",
  "toCycleId",
  "toDueDate",
  "toEstimate",
  "toParentId",
  "toPriority",
  "toProjectId",
  "toStateId",
  "toTeamId",
  "toTitle",
  "trashed",
  "triageResponsibilityAutoAssigned",
  "triageResponsibilityNotifiedUsers",
] as const;

type PossibleHistoryType = (typeof historyFieldsOfInterest)[number];

export function getHistoryType(
  key: (typeof historyFieldsOfInterest)[number],
): string {
  return key.replace(/^(from|to)/, "");
}

export function getFirstHistoryType(history: IssueHistory): string | null {
  for (const field of historyFieldsOfInterest) {
    if (history[field]) {
      return getHistoryType(field) as PossibleHistoryType;
    }
  }
  return null;
}

export function getAllHistoryTypes(
  history: IssueHistory,
): PossibleHistoryType[] {
  return historyFieldsOfInterest.filter((field) => {
    if (!!history[field]) {
      return true;
    }
    if (field.startsWith("from") || field.startsWith("to")) {
      const correspondingKey = `${
        field.startsWith("from") ? "to" : "from"
      }${field.replace(/^(from|to)/, "")}`;
      if (history[correspondingKey as PossibleHistoryType] !== undefined) {
        return true;
      }
    }
    return false;
  });
}

export function getActivity(
  contextValues: IssueContextValueData,
  activity: IssueHistory,
): [ReactNode[], ReactNode | null] {
  const activityTypes = getAllHistoryTypes(activity).sort((a, b) =>
    getHistoryType(a).localeCompare(getHistoryType(b)),
  );
  const activitiesCount = activityTypes.reduce(
    (activitiesCount, activityType) => {
      const type = getHistoryType(activityType);
      if (!activitiesCount[type]) {
        activitiesCount[type] = [];
      }
      activitiesCount[type].push(activityType);
      return activitiesCount;
    },
    {} as Record<string, (typeof historyFieldsOfInterest)[number][]>,
  );

  let icon = null;
  let concatContent: ReactNode[] = [];

  Object.entries(activitiesCount).forEach(([type, [from, to]]) => {
    const content = getHistoryContent(
      contextValues,
      type,
      activity[from],
      activity[to],
    );

    if (!content) {
      return;
    }
    const [contentNode, iconNode] = content;
    if (iconNode) {
      icon = iconNode;
    }
    concatContent.push(contentNode);
  });

  return [concatContent, icon];
}

function getHistoryContent(
  contextValues: IssueContextValueData,
  type: string,
  from: any,
  to: any,
): [ReactNode, ReactNode | null] | null {
  const {
    users,
    projects,
    cycles,
    priorities,
    workflowStates,
    issueEstimations,
  } = contextValues;

  switch (type) {
    // 1 value
    case "addedLabels": {
      return [
        <>
          <span>added label(s) </span>
          {(from as IssueLabel[]).map((label) => (
            <Label inline key={label.id} issueLabel={label} />
          ))}
        </>,
        <LabelIcon size={13} />,
      ];
    }
    case "removedLabels": {
      return [
        <>
          <span>removed label(s) </span>
          {(from as IssueLabel[]).map((label) => (
            <Label inline key={label.id} issueLabel={label} />
          ))}
        </>,
        <LabelIcon size={13} />,
      ];
    }
    case "attachmentId": {
      return [<span>updated an attachment</span>, <LinkIcon size={13} />];
    }
    case "autoArchived": {
      return [<span>Issue was automatically archived</span>, null];
    }
    case "autoClosed": {
      return [<span>Issue was automatically closed</span>, null];
    }
    case "customerNeedId": {
      return [<span>changed the customer needs</span>, null];
    }
    case "descriptionUpdatedBy": {
      return [<span>updated the description</span>, null];
    }
    case "issueImport": {
      return [<span>Issue was imported</span>, null];
    }
    case "relationChanges": {
      return [<span>updated relations</span>, null];
    }

    case "trashed": {
      return [<span>Issue was moved to trash</span>, null];
    }
    case "triageResponsibilityAutoAssigned": {
      return [
        <span>was automatically assigned as triage responsible</span>,
        null,
      ];
    }
    case "triageResponsibilityNotifiedUsers": {
      return [<span>notified users for triage responsibility</span>, null];
    }

    // 2 values to compare
    case "AssigneeId": {
      const fromUser = users.find((user) => user.id === from)!;
      const toUser = users.find((user) => user.id === to)!;

      if (from && !to) {
        return [<span>removed assignee</span>, null];
      } else if (!from && to) {
        return [
          <span>
            assigned to <Assignee inline="text" user={toUser} />
          </span>,
          null,
        ];
      } else if (fromUser && toUser) {
        return [
          <span>
            changed assignee from <Assignee inline="text" user={fromUser} /> to{" "}
            <Assignee inline="text" user={toUser} />
          </span>,
          null,
        ];
      }
      return null;
    }
    case "CycleId": {
      const fromCycle = cycles.find((c) => c.id === from);
      const toCycle = cycles.find((c) => c.id === to);

      if (fromCycle && !toCycle) {
        return [
          <span>removed cycle</span>,
          <ProjectCycleIcon size={13} cycle={null} />,
        ];
      } else if (!fromCycle && toCycle) {
        return [
          <span>
            added cycle <ProjectCycle projectCycle={toCycle} inline="text" />
          </span>,
          <ProjectCycleIcon size={13} cycle={toCycle} />,
        ];
      } else if (fromCycle && toCycle) {
        return [
          <span>
            changed cycle from{" "}
            <ProjectCycle projectCycle={fromCycle} inline="text" /> to{" "}
            <ProjectCycle projectCycle={toCycle} inline="text" />
          </span>,
          <ProjectCycleIcon size={13} cycle={toCycle} />,
        ];
      }
      return null;
    }
    case "DueDate": {
      if (from && !to) {
        return [<span>removed due date</span>, null];
      } else if (!from && to) {
        return [<span>added due date {moment(to).format("L")}</span>, null];
      } else {
        return [
          <span>
            changed due date from {moment(from).format("L")} to{" "}
            {moment(to).format("L")}
          </span>,
          null,
        ];
      }
    }
    case "Estimate": {
      const fromEstimate = issueEstimations
        ? issueEstimations.find((e) => e.value === from)
        : null;
      const toEstimate = issueEstimations
        ? issueEstimations.find((e) => e.value === to)
        : null;

      if (fromEstimate && !toEstimate) {
        return [
          <span>removed estimate</span>,
          <EstimateIcon size={13} estimate={null} />,
        ];
      } else if (!fromEstimate && toEstimate) {
        return [
          <span>
            estimated complexity to{" "}
            <Estimate estimate={toEstimate} inline="text" />
          </span>,
          <EstimateIcon size={13} estimate={toEstimate} />,
        ];
      } else if (fromEstimate && toEstimate) {
        return [
          <span>
            {from > to ? "decreased" : "increased"} estimate from{" "}
            <Estimate estimate={fromEstimate} inline="text" /> to{" "}
            <Estimate estimate={toEstimate} inline="text" />
          </span>,
          <EstimateIcon size={13} estimate={toEstimate} />,
        ];
      }
      return null;
    }
    case "ParentId": {
      if (from && !to) {
        return [<span>removed parent issue</span>, null];
      } else if (!from && to) {
        return [<span>added parent issue</span>, null];
      } else {
        return [<span>changed parent issue</span>, null];
      }
    }
    case "Priority": {
      const fromPriority = priorities.find((p) => p.priority === (from || 0))!;
      const toPriority = priorities.find((p) => p.priority === (to || 0))!;

      if (fromPriority && !toPriority) {
        return [<span>removed priority</span>, <PriorityIcon size={13} />];
      } else if (!fromPriority && toPriority) {
        return [
          <span>
            added priority <Priority priority={toPriority} inline="text" />
          </span>,
          <PriorityIcon size={13} priority={toPriority} />,
        ];
      } else if (fromPriority && toPriority) {
        return [
          <span>
            changed priority from{" "}
            <Priority priority={fromPriority} inline="text" /> to{" "}
            <Priority priority={toPriority} inline="text" />
          </span>,
          <PriorityIcon size={13} priority={toPriority} />,
        ];
      }
      return null;
    }
    case "ProjectId": {
      const fromProject = projects.find((p) => p.id === from);
      const toProject = projects.find((p) => p.id === to);

      if (fromProject && !toProject) {
        return [<span>removed project</span>, <ProjectIcon size={13} />];
      } else if (!fromProject && toProject) {
        return [
          <span>
            added project <Project inline="text" project={toProject} />
          </span>,
          <ProjectIcon size={13} />,
        ];
      } else if (fromProject && toProject) {
        return [
          <span>
            changed project from <Project inline="text" project={fromProject} />{" "}
            to <Project inline="text" project={toProject} />
          </span>,
          <ProjectIcon size={13} />,
        ];
      }
      return null;
    }
    case "StateId": {
      const fromState = workflowStates.find((s) => s.id === from);
      const toState = workflowStates.find((s) => s.id === to);

      if (fromState && !toState) {
        return [<span>removed state</span>, null];
      } else if (!fromState && toState) {
        return [
          <span>
            added state <WorkflowState workflowState={toState} inline="text" />
          </span>,
          <WorkflowStateIcon size={13} workflowState={toState} />,
        ];
      } else if (fromState && toState) {
        return [
          <span>
            changed state from{" "}
            <WorkflowState workflowState={fromState} inline="text" /> to{" "}
            <WorkflowState workflowState={toState} inline="text" />
          </span>,
          <WorkflowStateIcon size={13} workflowState={toState} />,
        ];
      }
      return null;
    }
    case "TeamId": {
      if (from && !to) {
        return [<span>removed team</span>, null];
      } else if (!from && to) {
        return [<span>added team</span>, null];
      } else {
        return [<span>changed team</span>, null];
      }
    }
    case "Title": {
      return [
        <span>
          changed title from "{from}" to "{to}"
        </span>,
        null,
      ];
    }
    case "ConvertedProjectId": {
      const toProject = projects.find((p) => p.id === to);

      if (!toProject) {
        return null;
      }

      return [
        <span>
          has converted the project to{" "}
          <Project inline="text" project={toProject} />
        </span>,
        null,
      ];
    }
    default:
      return null;
  }
}

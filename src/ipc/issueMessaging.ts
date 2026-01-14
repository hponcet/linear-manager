import { Issue, WorkflowState } from "@linear/sdk";
import { PropsMessage } from "./messaging";

export type IssueAction =
  | {
      action: "createIssue";
      fields: {
        title: string;
        description: string;
        teamId: string;
      };
    }
  | {
      action: "updateIssue";
      fields: {
        title?: string;
        description?: string;
      };
    }
  | {
      action: "updateState";
      stateId: WorkflowState["id"];
    };

export type IssueMessage =
  | PropsMessage<"issue">
  | {
      type: "updateIssue";
      payload: Partial<Issue>;
    }
  | {
      type: "updateIssueState";
      payload: Partial<WorkflowState>;
    }
  | {
      type: "updateStates";
      payload: Record<string, WorkflowState>;
    };

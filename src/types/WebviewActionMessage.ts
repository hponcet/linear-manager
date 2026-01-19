import { Issue } from "@linear/sdk";
import { Message, PropsAction } from "src/ipc/messaging";
import { Branch, Ref } from "./GitAPI";

export type Action<T extends string, P> = {
  type: T;
  payload: P;
};

export type Props = {
  issue: {
    issueId: Issue["id"] | null;
    linearAccessToken: string | undefined;
  };
  startWork: {
    branches: Ref[];
    currentBranch: Ref | null;
    issueId: Issue["id"] | null;
    linearAccessToken: string | undefined;
  };
};

export interface PropsMessage<K extends keyof Props> extends Message {
  type: "props";
  props: Props[K];
}

export type RequestDataUpdateActions =
  | Action<"closePanel", undefined>
  | Action<"openExternal", string>
  | Action<"updateIssue", number | undefined>
  | Action<"allBranchResult", Branch[]>
  | Action<"createBranchResult", undefined>
  | Action<"createBranchError", string>
  | Action<"hasUncommittedChangesResult", boolean>
  | Action<"checkoutResult", undefined>
  | Action<"checkoutError", string>;

type PanelActions =
  | {
      action: "closePanel";
    }
  | {
      action: "openExternal";
      url: string;
    };

type IssueAction =
  | {
      action: "updateIssue";
      issueId: Issue["id"];
    }
  | {
      action: "openIssue";
      issueId: Issue["id"];
    };

type StartWorkAction =
  | {
      action: "getAllBranch";
    }
  | {
      action: "createBranch";
      branchName: string;
      from: Ref;
    }
  | {
      action: "startWork";
      issueId: Issue["id"];
    }
  | {
      action: "hasUncommittedChanges";
    }
  | {
      action: "checkout";
      branchName: string;
    };

export type ToWebviewActions<K extends keyof Props> =
  | PropsMessage<K>
  | RequestDataUpdateActions;

export type FromWebviewActions =
  | IssueAction
  | StartWorkAction
  | PanelActions
  | PropsAction;

export type VsCodeApi = {
  postMessage(message: PropsAction | FromWebviewActions | PanelActions): void;
  setState(state: Record<string, any>): void;
  getState(): Record<string, any>;
};

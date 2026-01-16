import { Issue } from "@linear/sdk";
import { Message, PropsAction } from "src/ipc/messaging";
import { RequestDataUpdateActions } from "src/webviews/hooks/useRequestDataUpdate";

export type Action<T extends string, P> = {
  type: T;
  payload: P;
};

export type Props = {
  issue: {
    issueId: Issue["id"] | null;
    linearAccessToken: string | undefined;
  };
};

export interface PropsMessage<K extends keyof Props> extends Message {
  type: "props";
  props: Props[K];
}

type IssueAction =
  | {
      action: "updateIssue";
      issueId: Issue["id"];
    }
  | {
      action: "openIssue";
      issueId: Issue["id"];
    };

export type ToWebviewActions<K extends keyof Props> =
  | PropsMessage<K>
  | RequestDataUpdateActions;

export type FromWebviewActions = IssueAction;

export type VsCodeApi = {
  postMessage(message: PropsAction | FromWebviewActions): void;
  setState(state: Record<string, any>): void;
  getState(): Record<string, any>;
};

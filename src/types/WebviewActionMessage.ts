import { Issue } from "@linear/sdk";
import { LoggerAction } from "./MessageActions";
import { PropsAction } from "src/ipc/messaging";
import { IssueAction } from "src/ipc/issueMessaging";

export type Props = {
  issue: {
    issueId: Issue["id"] | null;
    linearAccessToken: string | undefined;
  };
};

export type VsCodeApi = {
  postMessage(message: LoggerAction | PropsAction | IssueAction): void;
  setState(state: Record<string, any>): void;
  getState(): Record<string, any>;
};

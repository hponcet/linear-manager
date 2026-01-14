import { Issue } from "@linear/sdk";

export type Action<T extends string, P> = {
  type: T;
  payload: P;
};

export type LoggerAction =
  | Action<"message-log", any[]>
  | Action<"message-warn", any[]>
  | Action<"message-error", any[]>;

export type IssuesAction = Action<"open-issue", Issue>;

export type MessageActions = LoggerAction | IssuesAction;

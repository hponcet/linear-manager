import { Issue } from "@linear/sdk";
import { Branch, Ref } from "./GitAPI";
import { VscStateKeys } from "src/vscStates";

export type Props = {
  issue: {
    issueId: Issue["id"] | null;
    linearAccessToken: string | undefined;
  };
  startWork: {
    issueId: Issue["id"] | null;
    linearAccessToken: string | undefined;
    fromCheckout: boolean;
    repoInitialized: boolean;
    gitInitialized: boolean;
  };
};

export type Request<
  T extends Ipc<"req">["type"],
  R extends Record<string, any> | void = void,
> = R extends void
  ? { type: T; resKey?: string }
  : { type: T; resKey?: string } & R;

export type Response<T extends Ipc<"req">["type"], R = void> = {
  type: `${T}_response`;
  resKey?: string;
  payload: R extends void ? void : R;
};

export type ResponseError<T extends Ipc<"req">["type"]> = {
  type: `${T}_error`;
  resKey?: string;
  error: string;
};

export type Action<
  T extends Ipc<"req">["type"],
  Req extends Record<string, any> | void = void,
  Res extends any | void = void,
> = {
  type: T;
  req: Request<T, Req>;
  res: Response<T, Res>;
  err: ResponseError<T>;
};

export type Listener<Type extends string, Payload> = {
  action: Type;
  payload: Payload;
};

export type Message<K extends keyof Props = any> =
  | Action<"props", void, Props[K]>
  | Action<"closePanel">
  | Action<"openExternal">
  | Action<"openExternalUrl", { url: string }>
  | Action<"updateIssue", { issueId: Issue["id"] }>
  | Action<"openIssue", { issueId: Issue["id"] }>
  | Action<
      "getGitStatus",
      { key: string },
      { repoActive: boolean; apiActive: boolean }
    >
  | Action<"getAllBranches", void, Branch[]>
  | Action<"getCurrentBranch", void, Ref | null>
  | Action<"createBranch", { branchName: string; from: Ref }, Ref>
  | Action<"startWork", { issueId: Issue["id"] }>
  | Action<"hasUncommittedChanges", void, boolean>
  | Action<"checkout", { branch: Ref }>
  | Action<"getState", { key: VscStateKeys }, { key: VscStateKeys; value: any }>
  | Action<"setState", { key: VscStateKeys; value: any; timestamp: number }>;

export type GlobalListenerMessage =
  | Listener<"updateIssue", number | undefined>
  | Listener<"stateUpdate", { value: any; timestamp: number; key: string }>
  | Listener<"gitActive", { repoActive: boolean; apiActive: boolean }>;

export type Ipc<
  K extends "req" | "res" | "err",
  T extends Message["type"] = Message["type"],
> = Extract<Message, { type: T }>[K];

export type IpcType<R extends "req" | "res" | "err"> = Ipc<R>["type"];
export type IpcResponse<T extends Ipc<"req">["type"]> = Ipc<"res", T>;
export type IpcError<T extends Ipc<"req">["type"]> = Ipc<"err", T>;

export type VsCodeApi = {
  postMessage(message: Ipc<"req">): void;
  setState(state: Record<string, any>): void;
  getState(): Record<string, any>;
};

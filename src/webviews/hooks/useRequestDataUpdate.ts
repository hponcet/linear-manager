import { Issue } from "@linear/sdk";
import { useEffect } from "react";
import { Ref } from "src/types/GitAPI";
import {
  GlobalListenerMessage,
  Ipc,
  IpcType,
  VsCodeApi,
} from "src/types/ActionMessage";

// @ts-expect-error
const acquireVsCodeApi = (window.acquireVsCodeApi ||
  (() => ({
    postMessage: () => { },
  }))) as () => VsCodeApi;

const VsCodeApi = acquireVsCodeApi();

const vscApi = {
  postMessage<T extends IpcType<"req">>(
    msg: { type: T } & Ipc<"req", T>,
  ): Promise<Ipc<"res", T>["payload"]> {
    VsCodeApi.postMessage(msg);
    return new Promise((resolve, reject) => {
      function handleMessage(e: MessageEvent<Ipc<"res">>) {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for response"));
          window.removeEventListener("message", handleMessage);
        }, 10000);

        const { type, payload } = e.data;

        if (type === `${msg.type}_response`) {
          clearTimeout(timeout);
          resolve(payload);
          window.removeEventListener("message", handleMessage);
        }
        if (type === `${msg.type}_error`) {
          clearTimeout(timeout);
          reject(new Error(payload));
          window.removeEventListener("message", handleMessage);
        }
      }
      window.addEventListener("message", handleMessage);
    });
  },
};

type RequestDataUpdateParams = {
  updateIssue?: (updatedAt?: number) => void;
};

export function useRequestDataUpdate(
  params?: Partial<RequestDataUpdateParams>,
) {
  const { updateIssue } = params || {};

  function handleGlobalMessages(e: MessageEvent<GlobalListenerMessage>) {
    const msg = e.data;
    if (msg.action === "updateIssue") updateIssue?.(msg.payload);
  }

  useEffect(() => {
    if (!updateIssue) return;

    window.addEventListener("message", handleGlobalMessages);
    return () => {
      window.removeEventListener("message", handleGlobalMessages);
    };
  }, [!!updateIssue]);

  return {
    closePanel: async () => vscApi.postMessage({ type: "closePanel" }),
    openExternal: (url: string) =>
      vscApi.postMessage<"openExternal">({ type: "openExternal", url }),
    updateIssue: (issueId: Issue["id"]) =>
      vscApi.postMessage({ type: "updateIssue", issueId }),
    openIssue: (issueId: Issue["id"]) =>
      vscApi.postMessage({ type: "openIssue", issueId }),
    startWork: (issueId: Issue["id"]) =>
      vscApi.postMessage({ type: "startWork", issueId }),
    getGitStatus: () =>
      vscApi.postMessage({ type: "getGitStatus", key: "gitStatus" }),
    getAllBranches: () => vscApi.postMessage({ type: "getAllBranches" }),
    getCurrentBranch: () => vscApi.postMessage({ type: "getCurrentBranch" }),
    createBranch: (branchName: string, from: Ref) =>
      vscApi.postMessage({ type: "createBranch", branchName, from }),
    hasUncommittedChanges: () =>
      vscApi.postMessage({ type: "hasUncommittedChanges" }),
    checkout: (branch: Ref) => vscApi.postMessage({ type: "checkout", branch }),
  };
}

export { vscApi };

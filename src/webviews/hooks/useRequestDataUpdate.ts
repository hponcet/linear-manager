import { Issue } from "@linear/sdk";
import { useEffect } from "react";
import { Ref } from "src/types/GitAPI";
import { ToWebviewActions } from "src/types/WebviewActionMessage";
import { VsCodeApi } from "src/types/WebviewActionMessage";

// @ts-expect-error
const acquireVsCodeApi = (window.acquireVsCodeApi ||
  (() => ({
    postMessage: () => {},
    setState: () => {},
    getState: () => ({}),
  }))) as () => VsCodeApi;

const vscApi = acquireVsCodeApi();

type RequestDataUpdateParams = {
  updateIssue?: (updatedAt?: number) => void;
};

export function useRequestDataUpdate(params: Partial<RequestDataUpdateParams>) {
  const { updateIssue } = params;

  function handleRequestDataUpdate(e: MessageEvent<ToWebviewActions<any>>) {
    const msg = e.data;

    if (msg.type === "updateIssue") updateIssue?.(msg.payload);
  }

  useEffect(() => {
    window.addEventListener("message", handleRequestDataUpdate);
    return () => {
      window.removeEventListener("message", handleRequestDataUpdate);
    };
  }, []);

  return {
    closePanel: () => vscApi.postMessage({ action: "closePanel" }),
    openExternal: (url: string) => {
      vscApi.postMessage({ action: "openExternal", url });
      console.log("openExternal", url);
    },
    updateIssue: (issueId: Issue["id"]) =>
      vscApi.postMessage({ action: "updateIssue", issueId }),
    openIssue: (issueId: Issue["id"]) =>
      vscApi.postMessage({ action: "openIssue", issueId }),
    startWork: (issueId: Issue["id"]) =>
      vscApi.postMessage({ action: "startWork", issueId }),
    getAllBranch: () => vscApi.postMessage({ action: "getAllBranch" }),
    createBranch: (branchName: string, from: Ref) => {
      vscApi.postMessage({ action: "createBranch", branchName, from });
      return new Promise<void>((resolve, reject) => {
        const handleMessage = (e: MessageEvent<ToWebviewActions<any>>) => {
          const msg = e.data;
          if (msg.type === "createBranchResult") {
            resolve();
            window.removeEventListener("message", handleMessage);
          }
          if (msg.type === "createBranchError") {
            reject(new Error(msg.payload));
            window.removeEventListener("message", handleMessage);
          }
        };
        window.addEventListener("message", handleMessage);
      });
    },
    hasUncommittedChanges: () => {
      vscApi.postMessage({ action: "hasUncommittedChanges" });
      return new Promise<boolean>((resolve) => {
        const handleMessage = (e: MessageEvent<ToWebviewActions<any>>) => {
          const msg = e.data;
          if (msg.type === "hasUncommittedChangesResult") {
            resolve(msg.payload);
            window.removeEventListener("message", handleMessage);
          }
        };
        window.addEventListener("message", handleMessage);
      });
    },
    checkout: (branchName: string) => {
      vscApi.postMessage({ action: "checkout", branchName });
      return new Promise<void>((resolve, reject) => {
        const handleMessage = (e: MessageEvent<ToWebviewActions<any>>) => {
          const msg = e.data;
          if (msg.type === "checkoutResult") {
            resolve();
            window.removeEventListener("message", handleMessage);
          }
          if (msg.type === "checkoutError") {
            reject(new Error(msg.payload));
            window.removeEventListener("message", handleMessage);
          }
        };
        window.addEventListener("message", handleMessage);
      });
    },
  };
}

export { vscApi };

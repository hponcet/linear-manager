import { Issue } from "@linear/sdk";
import { VsCodeApi } from "src/types/WebviewActionMessage";

// @ts-expect-error
const acquireVsCodeApi = (window.acquireVsCodeApi ||
  (() => ({
    postMessage: () => {},
    setState: () => {},
    getState: () => ({}),
  }))) as () => VsCodeApi;

const vscApi = acquireVsCodeApi();

function updateIssue(issueId: Issue["id"]) {
  vscApi.postMessage({ action: "updateIssue", issueId });
}

function openIssue(issueId: Issue["id"]) {
  vscApi.postMessage({ action: "openIssue", issueId });
}

export const panelActions = { updateIssue, openIssue };

export { vscApi };

import { Issue } from "@linear/sdk"
import { useEffect } from "react"
import { GlobalListenerMessage, Ipc, IpcType, VsCodeApi } from "src/types/ActionMessage"
import { Ref } from "src/types/GitAPI"

// @ts-expect-error no-undef
const acquireVsCodeApi = (window.acquireVsCodeApi ||
  (() => ({
    postMessage: () => undefined,
  }))) as () => VsCodeApi

const VsCodeApi = acquireVsCodeApi()

const vscApi = {
  postMessage<T extends IpcType<"req">>(
    msg: { type: T } & Ipc<"req", T>,
  ): Promise<Ipc<"res", T>["payload"]> {
    const _ipcReqId = Math.random().toString(36).substring(2, 15)
    VsCodeApi.postMessage({ ...msg, _ipcReqId })
    return new Promise((resolve, reject) => {
      function handleMessage(e: MessageEvent<Ipc<"res", T> | Ipc<"err", T>>) {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for response"))
          window.removeEventListener("message", handleMessage)
        }, 30000)

        const { type } = e.data

        if (type === `${msg.type}_response` && e.data._ipcReqId === _ipcReqId) {
          clearTimeout(timeout)
          resolve((e.data as unknown as Ipc<"res", T>).payload)
          window.removeEventListener("message", handleMessage)
        }

        if (type === `${msg.type}_error` && e.data._ipcReqId === _ipcReqId) {
          clearTimeout(timeout)
          reject(new Error((e.data as unknown as Ipc<"err", T>).error))
          window.removeEventListener("message", handleMessage)
        }
      }
      window.addEventListener("message", handleMessage)
    })
  },
}

type RequestDataUpdateParams = {
  updateIssue?: (updatedAt?: number) => void
}

export function useRequestDataUpdate(params?: Partial<RequestDataUpdateParams>) {
  const { updateIssue } = params || {}

  function handleGlobalMessages(e: MessageEvent<GlobalListenerMessage>) {
    const msg = e.data
    if (msg.action === "updateIssue") updateIssue?.(msg.payload)
  }

  useEffect(() => {
    if (!updateIssue) return

    window.addEventListener("message", handleGlobalMessages)
    return () => {
      window.removeEventListener("message", handleGlobalMessages)
    }
  }, [!!updateIssue])

  return {
    closePanel: async () => vscApi.postMessage({ type: "closePanel" }),
    openExternal: (issueIdentifier?: Issue["identifier"]) =>
      vscApi.postMessage<"openExternal">({
        type: "openExternal",
        issueIdentifier,
      }),
    openExternalUrl: (url: string) => vscApi.postMessage({ type: "openExternalUrl", url }),
    updateIssue: (issueId: Issue["id"]) => vscApi.postMessage({ type: "updateIssue", issueId }),
    openIssue: (issueId: Issue["id"]) => vscApi.postMessage({ type: "openIssue", issueId }),
    startWork: (issueId: Issue["id"]) => vscApi.postMessage({ type: "startWork", issueId }),
    getGitStatus: () => vscApi.postMessage({ type: "getGitStatus", key: "gitStatus" }),
    getAllBranches: () => vscApi.postMessage({ type: "getAllBranches" }),
    getCurrentBranch: () => vscApi.postMessage({ type: "getCurrentBranch" }),
    createBranch: (branchName: string, from: Ref, stashChanges?: boolean) =>
      vscApi.postMessage({ type: "createBranch", branchName, from, stashChanges }),
    hasUncommittedChanges: () => vscApi.postMessage({ type: "hasUncommittedChanges" }),
    checkout: (branch: Ref, stashChanges?: boolean) =>
      vscApi.postMessage({ type: "checkout", branch, stashChanges }),
  }
}

export { vscApi }

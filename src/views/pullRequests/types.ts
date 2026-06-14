import { PullRequestInfo } from "src/gitProviders/types"

export function addKeyOnItem<I extends object, K extends "pullRequest" | "message">(
  item: I,
  key: K,
): I & { __key: K } {
  return Object.assign(item, { __key: key })
}

export type PullRequestItem = ReturnType<typeof addKeyOnItem<PullRequestInfo, "pullRequest">> & {
  linkedAssigneeUserId?: string
  linkedIssueIdentifier?: string
}

export type MessageItem = {
  id: string
  message: string
  __key: "message"
}

export type PullRequestTreeNode = PullRequestItem | MessageItem

export function isPullRequestItem(node: PullRequestTreeNode): node is PullRequestItem {
  return node.__key === "pullRequest"
}

export function isMessageItem(node: PullRequestTreeNode): node is MessageItem {
  return node.__key === "message"
}

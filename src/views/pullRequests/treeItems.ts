import { Commands } from "src/constants"
import { PullRequestInfo } from "src/gitProviders/types"
import { parseIssueIdentifierFromPullRequest } from "src/utils/parseIssueIdentifier"
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from "vscode"

import { MessageItem, PullRequestItem } from "./types"

export function createPullRequestTreeItem(
  pullRequest: PullRequestItem,
  assigneeIconUri?: Uri,
): TreeItem {
  const label = pullRequest.title?.trim() || `#${pullRequest.id}`
  const branchParts = [pullRequest.sourceBranch, pullRequest.targetBranch].filter(Boolean)
  const branchLabel = branchParts.length === 2 ? branchParts.join(" → ") : branchParts[0]
  const issueIdentifier = parseIssueIdentifierFromPullRequest(pullRequest)
  const descriptionParts = [branchLabel, pullRequest.authorLabel].filter(Boolean)

  const item = new TreeItem(label, TreeItemCollapsibleState.None)
  item.id = `pull-request:${pullRequest.id}`
  item.description = descriptionParts.join(" · ") || undefined
  item.tooltip = [label, issueIdentifier, branchLabel, pullRequest.authorLabel, pullRequest.url]
    .filter(Boolean)
    .join("\n")
  item.iconPath = assigneeIconUri
    ? { light: assigneeIconUri, dark: assigneeIconUri }
    : new ThemeIcon("git-pull-request")
  item.contextValue = issueIdentifier ? "pullRequestItemWithIssue" : "pullRequestItem"
  item.command = issueIdentifier
    ? {
        title: "Open linked Linear issue",
        command: Commands.openPullRequestLinkedIssue,
        arguments: [pullRequest],
      }
    : {
        title: "Open pull request on web",
        command: Commands.openPullRequestUrl,
        arguments: [pullRequest],
      }

  return item
}

export function createMessageTreeItem(messageItem: MessageItem): TreeItem {
  const item = new TreeItem(messageItem.message, TreeItemCollapsibleState.None)
  item.id = messageItem.id
  item.iconPath = new ThemeIcon("info")
  item.contextValue = "pullRequestMessage"
  return item
}

export function toPullRequestItem(pullRequest: PullRequestInfo): PullRequestItem {
  return {
    ...pullRequest,
    __key: "pullRequest",
  }
}

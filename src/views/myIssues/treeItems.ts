import { Commands } from "src/constants"
import { Controller } from "src/controller"
import { WorkflowStateWithStateProgress } from "src/types/Linear"
import { getDefaultWorkflowStateExpanded } from "src/views/treeViewExpansionState"
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode"

import { Team, Issue } from "./types"

/**
 * Creates a TreeItem for a team
 */
export function createTeamTreeItem(team: Team, expanded = true): TreeItem {
  const item = new TreeItem(
    team.name,
    expanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
  )
  item.id = team.id
  if (team.description) {
    item.description = team.description
  }
  return item
}

/**
 * Creates a TreeItem for a workflow state
 */
export function createWorkflowStateTreeItem(
  state: WorkflowStateWithStateProgress,
  issuesCount: number,
  expanded = getDefaultWorkflowStateExpanded(state.type),
): TreeItem {
  const item = new TreeItem(
    state.name,
    expanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
  )
  item.id = state.id
  item.description = `${issuesCount}`

  item.iconPath = Controller.resources.icons.get(
    state.type === "started"
      ? `started${Math.ceil(
          Math.min(Math.max((10 / state.stateTypeLength) * state.stateProgress, 0), 10),
        )}`
      : state.type,
  )

  return item
}

/**
 * Creates a TreeItem for an issue
 * @param issue The issue to create a TreeItem for
 * @param branchName The branch name if initialized, undefined otherwise
 * @param assigneeIconUri Generated assignee avatar icon, when available
 * @param assigneeEmail Email address of the issue assignee, when available
 */
export function buildIssueTreeItemTooltip(
  issue: Pick<Issue, "title">,
  options?: { branchName?: string; assigneeEmail?: string | null },
): string {
  const lines = [issue.title]

  if (options?.assigneeEmail) {
    lines.push("", options.assigneeEmail)
  }

  if (options?.branchName) {
    lines.push("", `🌿 ${options.branchName}`)
  }

  return lines.join("\n")
}

export function createIssueTreeItem(
  issue: Issue,
  branchName?: string,
  assigneeIconUri?: Uri,
  assigneeEmail?: string | null,
): TreeItem {
  const item = new TreeItem(`${issue.identifier}`, TreeItemCollapsibleState.None)
  item.id = issue.id
  item.tooltip = buildIssueTreeItemTooltip(issue, { branchName, assigneeEmail })
  item.description = `- ${issue.trashed ? "[trashed] " : ""}${issue.title}`

  // Use different contextValue to control which context menu items are shown
  item.contextValue = branchName ? "issueItemWithBranch" : "issueItem"
  item.iconPath = assigneeIconUri
    ? { light: assigneeIconUri, dark: assigneeIconUri }
    : Controller.resources.icons.get("treeIssue")

  item.command = {
    title: "Open Issue",
    command: Commands.openIssue,
    arguments: [issue],
  }

  return item
}

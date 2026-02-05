import { Commands } from "src/constants"
import { Controller } from "src/controller"
import { WorkflowStateWithStateProgress } from "src/types/Linear"
import { TreeItem, TreeItemCollapsibleState } from "vscode"

import { Team, Issue } from "./types"

/**
 * Creates a TreeItem for a team
 */
export function createTeamTreeItem(team: Team): TreeItem {
  const item = new TreeItem(team.name, TreeItemCollapsibleState.Expanded)
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
): TreeItem {
  const item = new TreeItem(
    state.name,
    ["unstarted", "started"].includes(state.type)
      ? TreeItemCollapsibleState.Expanded
      : TreeItemCollapsibleState.Collapsed,
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
 */
export function createIssueTreeItem(issue: Issue, branchName?: string): TreeItem {
  const item = new TreeItem(`${issue.identifier}`, TreeItemCollapsibleState.None)
  item.id = issue.id
  item.tooltip = branchName ? `${issue.title}\n\n🌿 ${branchName}` : issue.title
  item.description = `- ${issue.trashed ? "[trashed] " : ""}${issue.title}`

  // Use different contextValue to control which context menu items are shown
  item.contextValue = branchName ? "issueItemWithBranch" : "issueItem"
  item.iconPath = Controller.resources.icons.get("treeIssue")

  item.command = {
    title: "Open Issue",
    command: Commands.openIssue,
    arguments: [issue],
  }

  return item
}

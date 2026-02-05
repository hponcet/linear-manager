import { LinearClient, User } from "@linear/sdk"
import { window } from "vscode"

import { Team, WorkflowState, Issue, addKeyOnItem } from "./types"

export interface DataState {
  me: User | null
  teams: Record<string, Team>
  workflowStatesByTeam: Record<string, Record<string, WorkflowState>>
  myIssues: Map<string, Issue>
}

/**
 * Fetches the current user
 */
export async function fetchMe(
  linearClient: LinearClient,
  currentMe: User | null,
): Promise<User | null> {
  if (currentMe) {
    return currentMe
  }
  return await linearClient.viewer
}

/**
 * Fetches the user's teams
 */
export async function fetchTeams(
  linearClient: LinearClient,
  me: User | null,
): Promise<Record<string, Team>> {
  try {
    if (!me) {
      return {}
    }

    const teams = await me.teams({ first: 50 })
    return teams.nodes.reduce(
      (acc, team) => {
        acc[team.id] = addKeyOnItem(team, "team")
        return acc
      },
      {} as Record<string, Team>,
    )
  } catch (error) {
    window.showErrorMessage(
      `Failed to fetch user teams: ${error instanceof Error ? error.message : String(error)}`,
    )
    return {}
  }
}

/**
 * Fetches workflow states for each team
 */
export async function fetchWorkflowStates(
  linearClient: LinearClient,
  teams: Record<string, Team>,
): Promise<Record<string, Record<string, WorkflowState>>> {
  const workflowStatesByTeam: Record<string, Record<string, WorkflowState>> = {}

  try {
    for (const teamId in teams) {
      const workflowStates = await linearClient.workflowStates({
        filter: { team: { id: { eq: teamId } } },
      })

      workflowStatesByTeam[teamId] = workflowStates.nodes.reduce(
        (acc, state) => {
          acc[state.id] = addKeyOnItem(state, "workflowState")
          return acc
        },
        {} as Record<string, WorkflowState>,
      )
    }
  } catch (error) {
    window.showErrorMessage(
      `Failed to fetch workflow states: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return workflowStatesByTeam
}

/**
 * Fetches issues assigned to the user
 */
export async function fetchIssues(me: User | null): Promise<Issue[]> {
  try {
    if (!me) {
      return []
    }

    const issues = await me.assignedIssues({ first: 250 })
    return issues.nodes.map((issue) => addKeyOnItem(issue, "issue"))
  } catch (error) {
    window.showErrorMessage(
      `Failed to fetch assigned issues: ${error instanceof Error ? error.message : String(error)}`,
    )
    return []
  }
}

/**
 * Fetches issues from the current active cycle for given teams
 */
export async function fetchCurrentCycleIssues(
  linearClient: LinearClient,
  teams: Record<string, Team>,
): Promise<Issue[]> {
  try {
    const allIssues: Issue[] = []

    for (const teamId in teams) {
      // Get active cycles for this team
      const cycles = await linearClient.cycles({
        filter: {
          team: { id: { eq: teamId } },
          isActive: { eq: true },
        },
        first: 1,
      })

      if (cycles.nodes.length > 0) {
        const activeCycle = cycles.nodes[0]
        const cycleIssues = await activeCycle.issues({ first: 250 })
        allIssues.push(...cycleIssues.nodes.map((issue) => addKeyOnItem(issue, "issue")))
      }
    }

    return allIssues
  } catch (error) {
    window.showErrorMessage(
      `Failed to fetch cycle issues: ${error instanceof Error ? error.message : String(error)}`,
    )
    return []
  }
}

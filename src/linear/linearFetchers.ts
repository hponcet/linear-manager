import { LinearClient, User } from "@linear/sdk"
import { fetchAllPreviousPages } from "src/linear/pagination"
import { Team, WorkflowState, Issue, addKeyOnItem } from "src/views/myIssues/types"

export async function fetchViewer(linearClient: LinearClient): Promise<User> {
  return linearClient.viewer
}

export async function fetchTeamsFromMe(me: User | null): Promise<Record<string, Team>> {
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
}

export async function fetchWorkflowStatesByTeam(
  linearClient: LinearClient,
  teams: Record<string, Team>,
): Promise<Record<string, Record<string, WorkflowState>>> {
  const workflowStatesByTeam: Record<string, Record<string, WorkflowState>> = {}

  for (const teamId in teams) {
    const workflowStates = await linearClient.workflowStates({
      filter: { team: { id: { eq: teamId } } },
    })
    const workflowStateNodes = await fetchAllPreviousPages(workflowStates)

    workflowStatesByTeam[teamId] = workflowStateNodes.reduce(
      (acc, state) => {
        acc[state.id] = addKeyOnItem(state, "workflowState")
        return acc
      },
      {} as Record<string, WorkflowState>,
    )
  }

  return workflowStatesByTeam
}

export async function fetchAssignedIssues(me: User | null): Promise<Issue[]> {
  if (!me) {
    return []
  }

  const issues = await me.assignedIssues({ first: 250 })
  return issues.nodes.map((issue) => addKeyOnItem(issue, "issue"))
}

export async function fetchCurrentCycleIssues(
  linearClient: LinearClient,
  teams: Record<string, Team>,
): Promise<Issue[]> {
  const allIssues: Issue[] = []

  for (const teamId in teams) {
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
}

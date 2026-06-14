import { Cycle, IssueLabel, LinearClient, Project, ProjectLabel } from "@linear/sdk"
import { filterWorkflowStatesByType } from "src/panels/commons/worflowStates"
import { WorkflowStateWithStateProgress } from "src/types/Linear"

import { flattenAssignableLabels } from "./flattenAssignableLabels"
import { logLinearApiCall } from "./LinearApiLogger"
import { fetchAllPreviousPages } from "./pagination"

export type TeamMetadata = {
  labels: IssueLabel[]
  cycles: Cycle[]
  workflowStates: WorkflowStateWithStateProgress[]
  projects: Project[]
}

export async function fetchTeamMetadata(
  client: LinearClient,
  teamId: string,
): Promise<TeamMetadata> {
  logLinearApiCall(`fetchTeamMetadata:${teamId}`)

  const [labelsConnection, cyclesConnection, projectsConnection, workflowStatesConnection] =
    await Promise.all([
      client.issueLabels({
        filter: {
          team: {
            or: [{ id: { eq: teamId } }, { null: true }],
          },
        },
      }),
      client.cycles({
        filter: { team: { id: { eq: teamId } } },
      }),
      client.projects({
        filter: { accessibleTeams: { id: { eq: teamId } } },
      }),
      client.workflowStates({
        filter: { team: { id: { eq: teamId } } },
      }),
    ])

  const [labels, cycles, projects, workflowStateNodes] = await Promise.all([
    fetchAllPreviousPages(labelsConnection).then(flattenAssignableLabels),
    fetchAllPreviousPages(cyclesConnection),
    fetchAllPreviousPages(projectsConnection),
    fetchAllPreviousPages(workflowStatesConnection),
  ])

  return {
    labels,
    cycles,
    workflowStates: filterWorkflowStatesByType(workflowStateNodes),
    projects,
  }
}

export async function fetchProjectLabels(
  client: LinearClient,
  projectId: string,
): Promise<ProjectLabel[]> {
  logLinearApiCall(`fetchProjectLabels:${projectId}`)

  const project = await client.project(projectId)
  const labelsConnection = await project.labels()
  const labels = await fetchAllPreviousPages(labelsConnection)

  return flattenAssignableLabels(labels)
}

export async function fetchWorkspaceUsers(client: LinearClient) {
  logLinearApiCall("fetchWorkspaceUsers")
  const usersConnection = await client.users({ last: 100 })
  return fetchAllPreviousPages(usersConnection)
}

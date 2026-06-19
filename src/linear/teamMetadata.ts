import { Cycle, IssueLabel, LinearClient, Project, ProjectLabel } from "@linear/sdk"
import { filterWorkflowStatesByType } from "src/panels/commons/worflowStates"
import { WorkflowStateWithStateProgress } from "src/types/Linear"

import { flattenAssignableLabels } from "./flattenAssignableLabels"
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
  const project = await client.project(projectId)
  const labelsConnection = await project.labels()
  const labels = await fetchAllPreviousPages(labelsConnection)

  return flattenAssignableLabels(labels)
}

async function fetchAllWorkspaceIssueLabels(client: LinearClient): Promise<IssueLabel[]> {
  const labelsConnection = await client.issueLabels({ first: 250 })
  const labels = await fetchAllPreviousPages(labelsConnection)

  return flattenAssignableLabels(labels)
}

async function fetchAllWorkspaceProjectLabels(client: LinearClient): Promise<ProjectLabel[]> {
  const projectsConnection = await client.projects()
  const projects = await fetchAllPreviousPages(projectsConnection)
  const labelConnections = await Promise.all(projects.map((project) => project.labels()))
  const labelPages = await Promise.all(
    labelConnections.map((connection) => fetchAllPreviousPages(connection)),
  )

  return flattenAssignableLabels(labelPages.flat())
}

export async function fetchWorkspaceLabels(
  client: LinearClient,
): Promise<(IssueLabel | ProjectLabel)[]> {
  const [issueLabels, projectLabels] = await Promise.all([
    fetchAllWorkspaceIssueLabels(client),
    fetchAllWorkspaceProjectLabels(client),
  ])

  const byId = new Map<string, IssueLabel | ProjectLabel>()

  for (const label of issueLabels) {
    byId.set(label.id, label)
  }

  for (const label of projectLabels) {
    byId.set(label.id, label)
  }

  return Array.from(byId.values())
}

export async function fetchWorkspaceUsers(client: LinearClient) {
  const usersConnection = await client.users({ last: 100 })
  return fetchAllPreviousPages(usersConnection)
}

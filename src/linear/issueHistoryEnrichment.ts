import {
  Cycle,
  Issue,
  IssueHistory,
  IssuePriorityValue,
  LinearClient,
  Project,
  User,
  WorkflowState,
} from "@linear/sdk"
import { WorkflowStateWithStateProgress } from "src/types/Linear"
import {
  SerializedCycle,
  SerializedIssueHistory,
  SerializedProject,
  SerializedUser,
  SerializedWorkflowState,
} from "src/types/SerializedLinear"

import { serializeIssueHistoryEntry } from "./serializeForIpc"
import { TeamMetadata } from "./teamMetadata"

type UserSnapshot = Pick<SerializedUser, "id" | "displayName" | "email" | "name" | "avatarUrl">
type ProjectSnapshot = Pick<SerializedProject, "id" | "name" | "color" | "icon">
type CycleSnapshot = Pick<SerializedCycle, "id" | "name" | "number">
type WorkflowStateSnapshot = SerializedWorkflowState

export type IssueHistoryEnrichmentContext = {
  teamMetadata: TeamMetadata
  users: User[]
  priorities: IssuePriorityValue[]
  extraWorkflowStates?: Map<string, WorkflowStateWithStateProgress>
}

function snapshotUser(user: User | undefined): UserSnapshot | undefined {
  if (!user) {
    return undefined
  }

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? undefined,
  }
}

function snapshotProject(project: Project | undefined): ProjectSnapshot | undefined {
  if (!project) {
    return undefined
  }

  return {
    id: project.id,
    name: project.name,
    color: project.color ?? undefined,
    icon: project.icon ?? undefined,
  }
}

function snapshotCycle(cycle: Cycle | undefined): CycleSnapshot | undefined {
  if (!cycle) {
    return undefined
  }

  return {
    id: cycle.id,
    name: cycle.name ?? undefined,
    number: cycle.number,
  }
}

export function snapshotWorkflowState(
  state: WorkflowStateWithStateProgress | WorkflowState | undefined,
): WorkflowStateSnapshot | undefined {
  if (!state) {
    return undefined
  }

  return {
    id: state.id,
    name: state.name,
    color: state.color,
    type: state.type as WorkflowStateSnapshot["type"],
    position: state.position,
    stateProgress: "stateProgress" in state ? state.stateProgress : 0,
    stateTypeLength: "stateTypeLength" in state ? state.stateTypeLength : 1,
  }
}

function collectReferencedStateIds(entries: IssueHistory[]): Set<string> {
  const stateIds = new Set<string>()

  for (const entry of entries) {
    if (entry.fromStateId) {
      stateIds.add(entry.fromStateId)
    }
    if (entry.toStateId) {
      stateIds.add(entry.toStateId)
    }
  }

  return stateIds
}

export async function fetchMissingWorkflowStates(
  client: LinearClient,
  stateIds: Iterable<string>,
  knownStates: Map<string, WorkflowStateWithStateProgress>,
): Promise<Map<string, WorkflowStateWithStateProgress>> {
  const missing = [...stateIds].filter((id) => !knownStates.has(id))
  const fetched = new Map<string, WorkflowStateWithStateProgress>()

  await Promise.all(
    missing.map(async (stateId) => {
      const connection = await client.workflowStates({
        filter: { id: { eq: stateId } },
      })
      const state = connection.nodes[0]
      if (!state) {
        return
      }

      fetched.set(stateId, {
        ...state,
        stateProgress: 0,
        stateTypeLength: 1,
        type: state.type as WorkflowStateWithStateProgress["type"],
      })
    }),
  )

  return fetched
}

export function enrichIssueHistoryEntries(
  entries: IssueHistory[],
  context: IssueHistoryEnrichmentContext,
): SerializedIssueHistory[] {
  const { teamMetadata, users, priorities, extraWorkflowStates } = context

  const stateById = new Map<string, WorkflowStateWithStateProgress>(
    teamMetadata.workflowStates.map((state) => [state.id, state]),
  )
  for (const [stateId, state] of extraWorkflowStates ?? []) {
    stateById.set(stateId, state)
  }

  const userById = new Map(users.map((user) => [user.id, user]))
  const projectById = new Map(teamMetadata.projects.map((project) => [project.id, project]))
  const cycleById = new Map(teamMetadata.cycles.map((cycle) => [cycle.id, cycle]))
  const priorityByValue = new Map(priorities.map((priority) => [priority.priority, priority]))

  return entries.map((entry) => {
    const serialized = serializeIssueHistoryEntry(entry)

    serialized.resolved = {
      fromState: snapshotWorkflowState(
        entry.fromStateId ? stateById.get(entry.fromStateId) : undefined,
      ),
      toState: snapshotWorkflowState(entry.toStateId ? stateById.get(entry.toStateId) : undefined),
      fromAssignee: snapshotUser(
        entry.fromAssigneeId ? userById.get(entry.fromAssigneeId) : undefined,
      ),
      toAssignee: snapshotUser(entry.toAssigneeId ? userById.get(entry.toAssigneeId) : undefined),
      fromProject: snapshotProject(
        entry.fromProjectId ? projectById.get(entry.fromProjectId) : undefined,
      ),
      toProject: snapshotProject(
        entry.toProjectId
          ? projectById.get(entry.toProjectId)
          : entry.toConvertedProjectId
            ? projectById.get(entry.toConvertedProjectId)
            : undefined,
      ),
      fromCycle: snapshotCycle(entry.fromCycleId ? cycleById.get(entry.fromCycleId) : undefined),
      toCycle: snapshotCycle(entry.toCycleId ? cycleById.get(entry.toCycleId) : undefined),
      fromPriority:
        entry.fromPriority != null ? priorityByValue.get(entry.fromPriority) : undefined,
      toPriority: entry.toPriority != null ? priorityByValue.get(entry.toPriority) : undefined,
    }

    return serialized
  })
}

export async function buildIssueHistoryEnrichmentContext(
  client: LinearClient,
  issue: Issue,
  entries: IssueHistory[],
  loaders: {
    getTeamMetadata: (teamId: string) => Promise<TeamMetadata>
    getWorkspaceUsers: () => Promise<User[]>
    getPriorities: () => Promise<IssuePriorityValue[]>
  },
): Promise<IssueHistoryEnrichmentContext> {
  const teamId = issue.teamId
  if (!teamId) {
    return {
      teamMetadata: { labels: [], cycles: [], workflowStates: [], projects: [] },
      users: await loaders.getWorkspaceUsers(),
      priorities: await loaders.getPriorities(),
    }
  }

  const [teamMetadata, users, priorities] = await Promise.all([
    loaders.getTeamMetadata(teamId),
    loaders.getWorkspaceUsers(),
    loaders.getPriorities(),
  ])

  const knownStates = new Map(teamMetadata.workflowStates.map((state) => [state.id, state]))
  const referencedStateIds = collectReferencedStateIds(entries)
  const extraWorkflowStates = await fetchMissingWorkflowStates(
    client,
    referencedStateIds,
    knownStates,
  )

  return {
    teamMetadata,
    users,
    priorities,
    extraWorkflowStates,
  }
}

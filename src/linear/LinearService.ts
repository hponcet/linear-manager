import {
  Attachment,
  Comment,
  Issue,
  IssuePriorityValue,
  LinearClient,
  PaginationOrderBy,
  Team,
  User,
} from "@linear/sdk"
import {
  buildIssueHistoryEnrichmentContext,
  enrichIssueHistoryEntries,
} from "src/linear/issueHistoryEnrichment"
import { logLinearApiCall } from "src/linear/LinearApiLogger"
import { LinearCacheStore } from "src/linear/LinearCacheStore"
import {
  fetchAssignedIssues,
  fetchCurrentCycleIssues,
  fetchTeamsFromMe,
  fetchViewer,
  fetchWorkflowStatesByTeam,
} from "src/linear/linearFetchers"
import {
  fetchProjectLabels,
  fetchTeamMetadata,
  fetchWorkspaceUsers,
  TeamMetadata,
} from "src/linear/teamMetadata"
import { SerializedIssueHistory } from "src/types/SerializedLinear"
import {
  Issue as TreeIssue,
  Team as TreeTeam,
  WorkflowState,
  addKeyOnItem,
} from "src/views/myIssues/types"

import { fetchAllPreviousPages } from "./pagination"

export type IssueUpdateFields = Parameters<LinearClient["updateIssue"]>[1]
export type CreateReactionInput = Parameters<LinearClient["createReaction"]>[0]

export type IssueHistoryRequest = {
  issueId: Issue["id"]
}

export type IssueHistoryPage = {
  nodes: SerializedIssueHistory[]
}

export class LinearService {
  #getClient: () => LinearClient | null
  #cache: LinearCacheStore

  constructor(getClient: () => LinearClient | null, cache?: LinearCacheStore) {
    this.#getClient = getClient
    this.#cache =
      cache ?? new LinearCacheStore({ onCacheHit: (key) => logLinearApiCall(`cacheHit:${key}`) })
  }

  invalidateTeam(teamId: string): void {
    this.#cache.delete(`teamMetadata:${teamId}`)
  }

  invalidateIssue(issueId: string): void {
    this.#cache.delete(`issue:${issueId}`)
  }

  invalidateIssueLists(): void {
    this.#cache.delete("assignedIssues")
    this.#cache.deleteByPrefix("cycleIssues:")
  }

  invalidateAll(): void {
    this.#cache.clear()
  }

  async getViewer(): Promise<User> {
    return this.#cache.getOrFetch("viewer", async () => {
      const client = this.#requireClient()
      return fetchViewer(client)
    })
  }

  async getTeams(): Promise<Record<string, TreeTeam>> {
    return this.#cache.getOrFetch("teams", async () => {
      const me = await this.getViewer()
      return fetchTeamsFromMe(me)
    })
  }

  async getWorkflowStatesByTeam(): Promise<Record<string, Record<string, WorkflowState>>> {
    return this.#cache.getOrFetch("workflowStatesByTeam", async () => {
      const client = this.#requireClient()
      const teams = await this.getTeams()
      return fetchWorkflowStatesByTeam(client, teams)
    })
  }

  async getTeamMetadata(teamId: string): Promise<TeamMetadata> {
    return this.#cache.getOrFetch(`teamMetadata:${teamId}`, async () => {
      const client = this.#requireClient()
      return fetchTeamMetadata(client, teamId)
    })
  }

  async getProjectLabels(projectId: string) {
    return this.#cache.getOrFetch(`projectLabels:${projectId}`, async () => {
      const client = this.#requireClient()
      return fetchProjectLabels(client, projectId)
    })
  }

  async getWorkspaceUsers(): Promise<User[]> {
    return this.#cache.getOrFetch("workspaceUsers", async () => {
      const client = this.#requireClient()
      return fetchWorkspaceUsers(client)
    })
  }

  async getPriorities(): Promise<IssuePriorityValue[]> {
    return this.#cache.getOrFetch("priorities", async () => {
      logLinearApiCall("issuePriorityValues")
      const client = this.#requireClient()
      return client.issuePriorityValues
    })
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.#cache.getOrFetch(`team:${teamId}`, async () => {
      logLinearApiCall(`team:${teamId}`)
      const client = this.#requireClient()
      return client.team(teamId)
    })
  }

  async getIssue(issueId: string, options?: { bypassCache?: boolean }): Promise<Issue> {
    if (options?.bypassCache) {
      this.invalidateIssue(issueId)
    }

    return this.#cache.getOrFetch(`issue:${issueId}`, async () => {
      logLinearApiCall(`issue:${issueId}`)
      const client = this.#requireClient()
      return client.issue(issueId)
    })
  }

  async getIssueByIdentifier(identifier: string): Promise<Issue | null> {
    const normalized = identifier.trim().toUpperCase()
    if (!normalized.includes("-")) {
      return null
    }

    const issueId = await this.#cache.getOrFetch<string | null>(
      `issueIdentifier:${normalized}`,
      async () => {
        logLinearApiCall(`searchIssues:${normalized}`)
        const client = this.#requireClient()
        const result = await client.searchIssues(normalized)
        const match = result.nodes.find((node) => node.identifier?.toUpperCase() === normalized)
        return match?.id ?? null
      },
    )

    if (!issueId) {
      return null
    }

    return this.getIssue(issueId)
  }

  async getAssignedIssues(): Promise<TreeIssue[]> {
    return this.#cache.getOrFetch("assignedIssues", async () => {
      const me = await this.getViewer()
      return fetchAssignedIssues(me)
    })
  }

  async getCurrentCycleIssues(): Promise<TreeIssue[]> {
    const teams = await this.getTeams()
    const teamIds = Object.keys(teams).sort().join(",")

    return this.#cache.getOrFetch(`cycleIssues:${teamIds}`, async () => {
      const client = this.#requireClient()
      return fetchCurrentCycleIssues(client, teams)
    })
  }

  async getComments(issueId: string): Promise<Comment[]> {
    logLinearApiCall(`comments:${issueId}`)
    const client = this.#requireClient()
    const comments = await client.comments({
      filter: { issue: { id: { eq: issueId } } },
      orderBy: PaginationOrderBy.CreatedAt,
    })
    return fetchAllPreviousPages(comments)
  }

  async getSubIssues(issueId: string): Promise<Issue[]> {
    logLinearApiCall(`subIssues:${issueId}`)
    const issue = await this.getIssue(issueId)
    const subIssues = await issue.children({ last: 100 })
    return fetchAllPreviousPages(subIssues)
  }

  async getAttachments(
    issueId: string,
    options?: { bypassCache?: boolean },
  ): Promise<Attachment[]> {
    logLinearApiCall(`attachments:${issueId}`)
    const issue = await this.getIssue(issueId, options)
    const attachments = await issue.attachments({ last: 100 })
    return fetchAllPreviousPages(attachments)
  }

  async getIssueHistory(params: IssueHistoryRequest): Promise<IssueHistoryPage> {
    logLinearApiCall(`issueHistory:${params.issueId}`)
    const client = this.#requireClient()
    const issue = await this.getIssue(params.issueId)
    const firstPage = await issue.history({ first: 50 })
    const nodes = [...firstPage.nodes]
    let endCursor = firstPage.pageInfo.endCursor ?? null

    while (endCursor) {
      logLinearApiCall(`issueHistory:${params.issueId}:page`)
      const page = await issue.history({
        before: endCursor,
        last: 50,
        orderBy: PaginationOrderBy.CreatedAt,
      })
      nodes.push(...page.nodes)
      endCursor = page.pageInfo.endCursor ?? null
    }

    const enrichmentContext = await buildIssueHistoryEnrichmentContext(client, issue, nodes, {
      getTeamMetadata: (teamId) => this.getTeamMetadata(teamId),
      getWorkspaceUsers: () => this.getWorkspaceUsers(),
      getPriorities: () => this.getPriorities(),
    })

    return {
      nodes: enrichIssueHistoryEntries(nodes, enrichmentContext),
    }
  }

  async updateIssue(issueId: string, fields: IssueUpdateFields): Promise<Issue> {
    logLinearApiCall(`updateIssue:${issueId}`)
    const client = this.#requireClient()
    const result = await client.updateIssue(issueId, fields)
    const updatedIssue = await result.issue
    if (!updatedIssue) {
      throw new Error(`Failed to update issue ${issueId}`)
    }

    this.invalidateIssue(issueId)
    if (fields.stateId || fields.assigneeId !== undefined) {
      this.invalidateIssueLists()
    }

    return updatedIssue
  }

  async createComment(input: Parameters<LinearClient["createComment"]>[0]): Promise<void> {
    logLinearApiCall("createComment")
    await this.#requireClient().createComment(input)
    if (input.issueId) {
      this.invalidateIssue(input.issueId)
    }
  }

  async updateComment(commentId: string, body: string): Promise<void> {
    logLinearApiCall(`updateComment:${commentId}`)
    await this.#requireClient().updateComment(commentId, { body })
  }

  async deleteComment(commentId: string): Promise<void> {
    logLinearApiCall(`deleteComment:${commentId}`)
    await this.#requireClient().deleteComment(commentId)
  }

  async commentResolve(commentId: string, resolvingCommentId?: string): Promise<void> {
    logLinearApiCall(`commentResolve:${commentId}`)
    await this.#requireClient().commentResolve(
      commentId,
      resolvingCommentId ? { resolvingCommentId } : undefined,
    )
  }

  async commentUnresolve(commentId: string): Promise<void> {
    logLinearApiCall(`commentUnresolve:${commentId}`)
    await this.#requireClient().commentUnresolve(commentId)
  }

  async createReaction(reaction: CreateReactionInput): Promise<void> {
    logLinearApiCall("createReaction")
    await this.#requireClient().createReaction(reaction)
    if (reaction.issueId) {
      this.invalidateIssue(reaction.issueId)
    }
  }

  async deleteReaction(reactionId: string, issueId?: string): Promise<void> {
    logLinearApiCall(`deleteReaction:${reactionId}`)
    await this.#requireClient().deleteReaction(reactionId)
    if (issueId) {
      this.invalidateIssue(issueId)
    }
  }

  async deleteAttachment(attachmentId: string, issueId?: string): Promise<void> {
    logLinearApiCall(`deleteAttachment:${attachmentId}`)
    await this.#requireClient().deleteAttachment(attachmentId)
    if (issueId) {
      this.invalidateIssue(issueId)
    }
  }

  async createAttachment(input: Parameters<LinearClient["createAttachment"]>[0]): Promise<void> {
    logLinearApiCall("createAttachment")
    await this.#requireClient().createAttachment(input)
    this.invalidateIssue(input.issueId)
  }

  async createSubIssue(
    parentId: Issue["id"],
    teamId: string,
    fields: IssueUpdateFields,
  ): Promise<Issue> {
    logLinearApiCall("createSubIssue")
    const result = await this.#requireClient().createIssue({
      ...fields,
      parentId,
      teamId,
    })
    const createdIssue = await result.issue
    if (!createdIssue) {
      throw new Error(`Failed to create sub-issue for parent ${parentId}`)
    }

    this.invalidateIssue(parentId)
    this.invalidateIssueLists()
    return createdIssue
  }

  async deleteSubIssue(issueId: string): Promise<void> {
    logLinearApiCall(`deleteSubIssue:${issueId}`)
    await this.#requireClient().deleteIssue(issueId)
    this.invalidateIssue(issueId)
    this.invalidateIssueLists()
  }

  toTreeIssue(issue: Issue): TreeIssue {
    return addKeyOnItem(issue, "issue")
  }

  #requireClient(): LinearClient {
    const client = this.#getClient()
    if (!client) {
      throw new Error("Linear client is not available")
    }
    return client
  }
}

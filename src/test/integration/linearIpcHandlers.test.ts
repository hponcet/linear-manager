import * as assert from "assert"

import { Issue } from "@linear/sdk"

import { LinearService } from "../../linear/LinearService"
import { handleLinearIpcMessage } from "../../panels/linearIpcHandlers"
import { IssueSyncPayload } from "../../types/IssueSync"
import { SerializedIssue } from "../../types/SerializedLinear"
import { MyIssuesView } from "../../views/myIssues"

function createIssueActions() {
  const syncCalls: IssueSyncPayload[] = []
  let refreshIssuesCalls = 0

  const issueActions = {
    syncIssue: async (payload: IssueSyncPayload) => {
      syncCalls.push(payload)
    },
    refreshIssues: async () => {
      refreshIssuesCalls += 1
    },
  } as Pick<MyIssuesView["issuesActions"], "syncIssue" | "refreshIssues">

  return {
    issueActions: issueActions as MyIssuesView["issuesActions"],
    syncCalls,
    getRefreshIssuesCalls: () => refreshIssuesCalls,
  }
}

function createMockSdkIssue(overrides: Record<string, unknown> = {}): Issue {
  const stateId = (overrides._state as { id: string } | undefined)?.id ?? "state-1"
  const data = {
    id: "issue-1",
    title: "Test issue",
    identifier: "ENG-1",
    url: "https://linear.app/issue/ENG-1",
    number: 1,
    priority: 2,
    priorityLabel: "High",
    labelIds: [],
    branchName: "eng/test-issue",
    createdAt: new Date("2024-06-01T12:00:00.000Z"),
    updatedAt: new Date("2024-06-01T12:00:00.000Z"),
    reactions: [],
    _state: { id: stateId },
    _team: { id: "team-1" },
    ...overrides,
  }

  return Object.defineProperties(data, {
    stateId: { get: () => stateId, enumerable: false },
    teamId: { get: () => "team-1", enumerable: false },
    cycleId: { get: () => undefined, enumerable: false },
    projectId: { get: () => undefined, enumerable: false },
    assigneeId: {
      get: () => (data as { _assignee?: { id?: string } })._assignee?.id,
      enumerable: false,
    },
    parentId: { get: () => undefined, enumerable: false },
    creatorId: { get: () => undefined, enumerable: false },
  }) as unknown as Issue
}

suite("linearIpcHandlers integration", () => {
  function createMockService(overrides: Partial<LinearService> = {}): LinearService {
    return {
      getIssue: async (issueId: string) =>
        createMockSdkIssue({
          id: issueId,
        }),
      getTeamMetadata: async () => ({
        labels: [],
        cycles: [],
        workflowStates: [],
        projects: [],
      }),
      getProjectLabels: async () => [
        {
          id: "project-label-1",
          name: "Backend",
          color: "#ff0000",
          parentId: undefined,
          isGroup: false,
        },
      ],
      getComments: async () => [],
      updateIssue: async (
        issueId: string,
        fields: { title?: string; stateId?: string; assigneeId?: string | null },
      ) => {
        const stateId = fields.stateId ?? "state-1"
        return createMockSdkIssue({
          id: issueId,
          title: fields.title ?? "Test issue",
          updatedAt: new Date("2024-06-02T12:00:00.000Z"),
          _state: { id: stateId },
          _assignee: fields.assigneeId ? { id: fields.assigneeId } : undefined,
        })
      },
      createComment: async () => undefined,
      ...overrides,
    } as unknown as LinearService
  }

  test("getIssue returns serialized issue with getter-backed IDs", async () => {
    const { issueActions } = createIssueActions()
    const service = createMockService()

    const result = await handleLinearIpcMessage(
      { type: "getIssue", issueId: "issue-1" },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, true)
    if (!result.handled) {
      return
    }

    const issue = result.payload as SerializedIssue
    assert.ok(issue.updatedAt instanceof Date)
    assert.strictEqual(issue.id, "issue-1")
    assert.strictEqual(issue.stateId, "state-1")
    assert.strictEqual(issue.teamId, "team-1")
  })

  test("linearUpdateIssue syncs the tree view via issueActions", async () => {
    const { issueActions, syncCalls } = createIssueActions()
    const service = createMockService()

    const result = await handleLinearIpcMessage(
      {
        type: "linearUpdateIssue",
        issueId: "issue-1",
        fields: { title: "Updated title", stateId: "state-2" },
      },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, true)
    assert.strictEqual(syncCalls.length, 1)
    assert.strictEqual(syncCalls[0]?.issueId, "issue-1")
    assert.strictEqual(syncCalls[0]?.title, "Updated title")
    assert.strictEqual(syncCalls[0]?.stateId, "state-2")
  })

  test("linearUpdateIssue sync payload includes assigneeId", async () => {
    const { issueActions, syncCalls } = createIssueActions()
    const service = createMockService()

    const result = await handleLinearIpcMessage(
      {
        type: "linearUpdateIssue",
        issueId: "issue-1",
        fields: { assigneeId: "user-2" },
      },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, true)
    assert.strictEqual(syncCalls.length, 1)
    assert.strictEqual(syncCalls[0]?.assigneeId, "user-2")
  })

  test("getTeamMetadata delegates to LinearService", async () => {
    const { issueActions } = createIssueActions()
    const service = createMockService()

    const result = await handleLinearIpcMessage(
      { type: "getTeamMetadata", teamId: "team-1" },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, true)
    if (!result.handled) {
      return
    }

    const metadata = result.payload as { workflowStates: unknown[] }
    assert.ok(Array.isArray(metadata.workflowStates))
  })

  test("getProjectLabels delegates to LinearService and serializes labels", async () => {
    const { issueActions } = createIssueActions()
    const service = createMockService()

    const result = await handleLinearIpcMessage(
      { type: "getProjectLabels", projectId: "project-1" },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, true)
    if (!result.handled) {
      return
    }

    const labels = result.payload as { id: string; name: string; color: string }[]
    assert.strictEqual(labels.length, 1)
    assert.strictEqual(labels[0]?.id, "project-label-1")
    assert.strictEqual(labels[0]?.name, "Backend")
  })

  test("createSubIssue refreshes My Issues and returns the created issue", async () => {
    const { issueActions, getRefreshIssuesCalls } = createIssueActions()
    const service = createMockService({
      createSubIssue: async () =>
        createMockSdkIssue({
          id: "issue-2",
          identifier: "ENG-2",
          title: "New sub-issue",
          _state: { id: "state-1" },
        }),
    })

    const result = await handleLinearIpcMessage(
      {
        type: "createSubIssue",
        parentId: "issue-1",
        teamId: "team-1",
        fields: { title: "New sub-issue" },
      },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, true)
    assert.strictEqual(getRefreshIssuesCalls(), 1)
    if (!result.handled) {
      return
    }

    const issue = result.payload as SerializedIssue
    assert.strictEqual(issue.id, "issue-2")
    assert.strictEqual(issue.title, "New sub-issue")
  })

  test("createComment delegates to LinearService", async () => {
    let createCommentCalled = false
    const service = createMockService({
      createComment: async (input: { issueId: string; body: string }) => {
        createCommentCalled = true
        assert.strictEqual(input.issueId, "issue-1")
        assert.strictEqual(input.body, "New comment")
      },
    })

    const { issueActions } = createIssueActions()

    const result = await handleLinearIpcMessage(
      { type: "createComment", issueId: "issue-1", body: "New comment" },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, true)
    assert.strictEqual(createCommentCalled, true)
  })

  test("returns handled false for unknown IPC messages", async () => {
    const { issueActions } = createIssueActions()
    const service = createMockService()

    const result = await handleLinearIpcMessage(
      { type: "openIssue", issueId: "issue-1" },
      issueActions,
      service,
    )

    assert.strictEqual(result.handled, false)
  })
})

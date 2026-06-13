import * as assert from "assert"

import { Issue, LinearClient } from "@linear/sdk"

import { LinearCacheStore } from "../../linear/LinearCacheStore"
import { LinearService } from "../../linear/LinearService"

function createMockIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-1",
    title: "Test issue",
    identifier: "ENG-1",
    stateId: "state-1",
    updatedAt: new Date("2024-06-01T12:00:00.000Z"),
    ...overrides,
  } as Issue
}

function createMockClient(options?: {
  issue?: Issue
  onIssueFetch?: () => void
  onAssignedIssuesFetch?: () => void
}): LinearClient {
  const issue = options?.issue ?? createMockIssue()

  const mockMe = {
    teams: async () => ({ nodes: [] }),
    assignedIssues: async () => {
      options?.onAssignedIssuesFetch?.()
      return { nodes: [issue] }
    },
  }

  return {
    viewer: Promise.resolve(mockMe) as unknown as User,
    issue: async () => {
      options?.onIssueFetch?.()
      return issue
    },
    updateIssue: async (_id: string, fields: Record<string, unknown>) => ({
      issue: Promise.resolve({ ...issue, ...fields } as Issue),
    }),
  } as unknown as LinearClient
}

// Minimal User typing for mock viewer
type User = Awaited<LinearClient["viewer"]>

suite("LinearService integration", () => {
  test("getIssue caches repeated reads for the same issue", async () => {
    let issueFetchCount = 0
    const service = new LinearService(
      () =>
        createMockClient({
          onIssueFetch: () => {
            issueFetchCount += 1
          },
        }),
      new LinearCacheStore(),
    )

    await service.getIssue("issue-1")
    await service.getIssue("issue-1")

    assert.strictEqual(issueFetchCount, 1)
  })

  test("getIssue bypassCache forces a fresh fetch", async () => {
    let issueFetchCount = 0
    const service = new LinearService(
      () =>
        createMockClient({
          onIssueFetch: () => {
            issueFetchCount += 1
          },
        }),
      new LinearCacheStore(),
    )

    await service.getIssue("issue-1")
    await service.getIssue("issue-1", { bypassCache: true })

    assert.strictEqual(issueFetchCount, 2)
  })

  test("invalidateIssue during an in-flight fetch still returns fresh data on bypass", async () => {
    let issueFetchCount = 0
    let resolveFirstFetch: (() => void) | undefined
    const firstFetchGate = new Promise<void>((resolve) => {
      resolveFirstFetch = resolve
    })

    const service = new LinearService(
      () =>
        ({
          issue: async () => {
            issueFetchCount += 1
            if (issueFetchCount === 1) {
              await firstFetchGate
            }
            return createMockIssue({ title: `Fetch ${issueFetchCount}` })
          },
        }) as unknown as LinearClient,
      new LinearCacheStore(),
    )

    const firstFetch = service.getIssue("issue-1")
    service.invalidateIssue("issue-1")
    resolveFirstFetch?.()

    await firstFetch
    const freshIssue = await service.getIssue("issue-1", { bypassCache: true })

    assert.strictEqual(issueFetchCount, 2)
    assert.strictEqual(freshIssue.title, "Fetch 2")
  })

  test("updateIssue invalidates the issue cache", async () => {
    let issueFetchCount = 0
    const service = new LinearService(
      () =>
        createMockClient({
          onIssueFetch: () => {
            issueFetchCount += 1
          },
        }),
      new LinearCacheStore(),
    )

    await service.getIssue("issue-1")
    await service.updateIssue("issue-1", { title: "Updated title" })
    await service.getIssue("issue-1")

    assert.strictEqual(issueFetchCount, 2)
  })

  test("updateIssue with stateId invalidates assigned issue lists", async () => {
    let assignedFetchCount = 0
    const service = new LinearService(
      () =>
        createMockClient({
          onAssignedIssuesFetch: () => {
            assignedFetchCount += 1
          },
        }),
      new LinearCacheStore(),
    )

    await service.getAssignedIssues()
    await service.updateIssue("issue-1", { stateId: "state-2" })
    await service.getAssignedIssues()

    assert.strictEqual(assignedFetchCount, 2)
  })

  test("invalidateAll clears cached data", async () => {
    let issueFetchCount = 0
    const service = new LinearService(
      () =>
        createMockClient({
          onIssueFetch: () => {
            issueFetchCount += 1
          },
        }),
      new LinearCacheStore(),
    )

    await service.getIssue("issue-1")
    service.invalidateAll()
    await service.getIssue("issue-1")

    assert.strictEqual(issueFetchCount, 2)
  })

  test("createComment invalidates the parent issue cache", async () => {
    let issueFetchCount = 0
    const service = new LinearService(
      () =>
        ({
          ...createMockClient({
            onIssueFetch: () => {
              issueFetchCount += 1
            },
          }),
          createComment: async () => undefined,
        }) as unknown as LinearClient,
      new LinearCacheStore(),
    )

    await service.getIssue("issue-1")
    await service.createComment({ issueId: "issue-1", body: "Hello" })
    await service.getIssue("issue-1")

    assert.strictEqual(issueFetchCount, 2)
  })

  test("getIssueHistory fetches all history pages", async () => {
    let historyFetchCount = 0
    const historyNodes = [
      { id: "history-1", createdAt: new Date(), updatedAt: new Date() },
      { id: "history-2", createdAt: new Date(), updatedAt: new Date() },
      { id: "history-3", createdAt: new Date(), updatedAt: new Date() },
    ]

    const emptyConnection = {
      nodes: [] as unknown[],
      pageInfo: { hasPreviousPage: false, endCursor: null },
      fetchPrevious: async () => emptyConnection,
    }

    const mockIssue = {
      teamId: "team-1",
      history: async (params: { first?: number; before?: string; last?: number }) => {
        historyFetchCount += 1

        if (params.first) {
          return {
            nodes: [historyNodes[0]],
            pageInfo: { endCursor: "cursor-1", hasPreviousPage: true },
          }
        }

        return {
          nodes: [historyNodes[1], historyNodes[2]],
          pageInfo: { endCursor: null, hasPreviousPage: false },
        }
      },
    }

    const service = new LinearService(
      () =>
        ({
          issue: async () => mockIssue,
          issueLabels: async () => emptyConnection,
          cycles: async () => emptyConnection,
          projects: async () => emptyConnection,
          workflowStates: async () => emptyConnection,
          users: async () => emptyConnection,
          get issuePriorityValues() {
            return Promise.resolve([])
          },
        }) as unknown as LinearClient,
      new LinearCacheStore(),
    )

    const page = await service.getIssueHistory({ issueId: "issue-1" })

    assert.strictEqual(historyFetchCount, 2)
    assert.strictEqual(page.nodes.length, 3)
    assert.deepStrictEqual(
      page.nodes.map((node) => node.id),
      ["history-1", "history-2", "history-3"],
    )
    assert.ok(page.nodes.every((node) => node.resolved !== undefined))
  })
})

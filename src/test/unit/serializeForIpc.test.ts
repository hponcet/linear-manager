import * as assert from "assert"

import { Issue, Comment, IssueHistory } from "@linear/sdk"

import {
  serializeComment,
  serializeIssue,
  serializeIssueHistoryEntry,
  serializeTeamMetadata,
} from "../../linear/serializeForIpc"
import { TeamMetadata } from "../../linear/teamMetadata"

function createMockIssue(): Issue {
  const data = {
    id: "issue-1",
    identifier: "ENG-1",
    title: "Test issue",
    url: "https://linear.app/issue/ENG-1",
    number: 1,
    priority: 2,
    priorityLabel: "High",
    labelIds: ["label-1"],
    branchName: "eng/test-issue",
    createdAt: new Date("2024-06-01T12:00:00.000Z"),
    updatedAt: new Date("2024-06-02T12:00:00.000Z"),
    reactions: [],
    _state: { id: "state-1" },
    _team: { id: "team-1" },
    _cycle: { id: "cycle-1" },
    _project: { id: "project-1" },
    _assignee: { id: "user-1" },
    _parent: { id: "parent-1" },
    _creator: { id: "creator-1" },
  }

  return Object.defineProperties(data, {
    stateId: { get: () => "state-1", enumerable: false },
    teamId: { get: () => "team-1", enumerable: false },
    cycleId: { get: () => "cycle-1", enumerable: false },
    projectId: { get: () => "project-1", enumerable: false },
    assigneeId: { get: () => "user-1", enumerable: false },
    parentId: { get: () => "parent-1", enumerable: false },
    creatorId: { get: () => "creator-1", enumerable: false },
  }) as unknown as Issue
}

function createMockComment(): Comment {
  const data = {
    id: "comment-1",
    body: "Hello",
    issueId: "issue-1",
    parentId: null,
    resolvingCommentId: null,
    createdAt: new Date("2024-06-01T12:00:00.000Z"),
    updatedAt: new Date("2024-06-01T12:00:00.000Z"),
    _user: { id: "user-1" },
    _resolvingUser: { id: "user-2" },
  }

  return Object.defineProperties(data, {
    userId: { get: () => "user-1", enumerable: false },
    resolvingUserId: { get: () => "user-2", enumerable: false },
  }) as unknown as Comment
}

suite("serializeForIpc", () => {
  test("serializeIssue reads getter-backed IDs that spread loses", () => {
    const issue = createMockIssue()
    const spread = { ...issue } as Record<string, unknown>
    const serialized = serializeIssue(issue)

    assert.strictEqual(spread.stateId, undefined)
    assert.strictEqual(spread.teamId, undefined)
    assert.strictEqual(serialized.stateId, "state-1")
    assert.strictEqual(serialized.teamId, "team-1")
    assert.strictEqual(serialized.cycleId, "cycle-1")
    assert.strictEqual(serialized.projectId, "project-1")
    assert.strictEqual(serialized.assigneeId, "user-1")
    assert.strictEqual(serialized.parentId, "parent-1")
    assert.strictEqual(serialized.identifier, "ENG-1")
    assert.ok(serialized.createdAt instanceof Date)
  })

  test("serializeComment preserves userId getter", () => {
    const comment = createMockComment()
    const spread = { ...comment } as Record<string, unknown>
    const serialized = serializeComment(comment)

    assert.strictEqual(spread.userId, undefined)
    assert.strictEqual(serialized.userId, "user-1")
    assert.strictEqual(serialized.resolvingUserId, "user-2")
    assert.strictEqual(serialized.body, "Hello")
  })

  test("serializeComment reads resolvingUserId from linked user", () => {
    const comment = {
      id: "comment-1",
      body: "Hello",
      parentId: null,
      resolvingCommentId: null,
      createdAt: new Date("2024-06-01T12:00:00.000Z"),
      updatedAt: new Date("2024-06-01T12:00:00.000Z"),
      _resolvingUser: { id: "user-2" },
    } as unknown as Comment

    const serialized = serializeComment(comment)

    assert.strictEqual(serialized.resolvingUserId, "user-2")
  })

  test("serializeComment preserves userId getter and reactions", () => {
    const comment = createMockComment()
    const commentWithReactions = Object.assign(comment, {
      reactions: [
        {
          id: "reaction-1",
          emoji: "1f44d",
          createdAt: new Date("2024-06-01T12:00:00.000Z"),
          updatedAt: new Date("2024-06-01T12:00:00.000Z"),
          _user: { id: "user-1" },
        },
      ],
    })

    Object.defineProperty(commentWithReactions.reactions[0], "userId", {
      get: () => "user-1",
      enumerable: false,
    })

    const serialized = serializeComment(commentWithReactions as Comment)

    assert.strictEqual(serialized.userId, "user-1")
    assert.strictEqual(serialized.reactions.length, 1)
    assert.strictEqual(serialized.reactions[0]?.emoji, "1f44d")
    assert.strictEqual(serialized.reactions[0]?.userId, "user-1")
  })

  test("serializeTeamMetadata returns plain nested objects", () => {
    const metadata = {
      labels: [{ id: "label-1", name: "Bug", color: "#ff0000", parentId: undefined }],
      cycles: [
        {
          id: "cycle-1",
          name: "Cycle 1",
          number: 1,
          startsAt: new Date("2024-06-01"),
          endsAt: new Date("2024-06-14"),
          isActive: true,
          isNext: false,
        },
      ],
      workflowStates: [
        {
          id: "state-1",
          name: "In Progress",
          color: "#0000ff",
          type: "started" as const,
          position: 1,
          stateProgress: 0,
          stateTypeLength: 2,
        },
      ],
      projects: [{ id: "project-1", name: "Project A", color: "#00ff00", icon: "box" }],
    } as TeamMetadata

    const serialized = serializeTeamMetadata(metadata)

    assert.strictEqual(serialized.labels[0]?.id, "label-1")
    assert.strictEqual(serialized.cycles[0]?.number, 1)
    assert.strictEqual(serialized.workflowStates[0]?.type, "started")
    assert.strictEqual(serialized.projects[0]?.name, "Project A")
  })

  test("serializeIssueHistoryEntry preserves change fields for IPC", () => {
    const entry = {
      id: "history-1",
      actorId: "user-1",
      fromStateId: "state-1",
      toStateId: "state-2",
      fromPriority: 0,
      createdAt: new Date("2024-06-01T12:00:00.000Z"),
      updatedAt: new Date("2024-06-02T12:00:00.000Z"),
      addedLabels: [{ id: "label-1", name: "Bug", color: "#ff0000" }],
    } as IssueHistory

    const serialized = serializeIssueHistoryEntry(entry)

    assert.strictEqual(serialized.id, "history-1")
    assert.strictEqual(serialized.fromStateId, "state-1")
    assert.strictEqual(serialized.toStateId, "state-2")
    assert.strictEqual(serialized.fromPriority, 0)
    assert.ok(serialized.createdAt instanceof Date)
    assert.deepStrictEqual(serialized.addedLabels, [
      { id: "label-1", name: "Bug", color: "#ff0000" },
    ])
  })
})

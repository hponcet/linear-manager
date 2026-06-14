import * as assert from "assert"

import { Issue } from "@linear/sdk"

import { addKeyOnItem } from "../../views/myIssues/types"

function createMockIssue(): Issue {
  const data = {
    id: "issue-1",
    identifier: "ENG-1",
    title: "Test issue",
    _assignee: { id: "user-1" },
  }

  return Object.defineProperties(data, {
    assigneeId: { get: () => "user-1", enumerable: false },
  }) as unknown as Issue
}

suite("addKeyOnItem", () => {
  test("preserves getter-backed assigneeId on issues", () => {
    const issue = createMockIssue()
    const treeIssue = addKeyOnItem(issue, "issue")

    assert.strictEqual(treeIssue.__key, "issue")
    assert.strictEqual(treeIssue.assigneeId, "user-1")
  })
})

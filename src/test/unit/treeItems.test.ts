import * as assert from "assert"

import { buildIssueTreeItemTooltip } from "../../views/myIssues/treeItems"

suite("buildIssueTreeItemTooltip", () => {
  test("includes assignee email between title and branch name", () => {
    const tooltip = buildIssueTreeItemTooltip(
      { title: "Fix tree icons" },
      {
        assigneeEmail: "hugues@example.com",
        branchName: "feature/icons",
      },
    )

    assert.strictEqual(tooltip, "Fix tree icons\n\nhugues@example.com\n\n🌿 feature/icons")
  })

  test("omits assignee email when unavailable", () => {
    const tooltip = buildIssueTreeItemTooltip({ title: "Fix tree icons" })

    assert.strictEqual(tooltip, "Fix tree icons")
  })
})

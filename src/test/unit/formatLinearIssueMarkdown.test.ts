import * as assert from "assert"

import { formatLinearIssueMarkdown } from "../../mcp/formatLinearIssueMarkdown"

suite("formatLinearIssueMarkdown", () => {
  test("includes state and assignee when provided", () => {
    const markdown = formatLinearIssueMarkdown(
      {
        id: "issue-1",
        identifier: "ENG-1",
        title: "Fix bug",
        url: "https://linear.app/acme/issue/ENG-1",
        description: "Details here",
        priority: 2,
        parentId: null,
      } as never,
      {
        stateName: "In Progress",
        assigneeName: "Alex",
        teamName: "Engineering",
        labelNames: ["Bug"],
      },
    )

    assert.match(markdown, /ENG-1/)
    assert.match(markdown, /In Progress/)
    assert.match(markdown, /Alex/)
    assert.match(markdown, /Bug/)
    assert.match(markdown, /Details here/)
  })
})

import * as assert from "assert"

import {
  formatLinearIssueCommentsMarkdown,
  MAX_COMMENT_BODY_CHARS,
} from "../../mcp/formatLinearIssueCommentsMarkdown"

suite("formatLinearIssueCommentsMarkdown", () => {
  test("renders threaded comments in chronological order", () => {
    const markdown = formatLinearIssueCommentsMarkdown("ENG-1", [
      {
        id: "c2",
        body: "Reply body",
        parentId: "c1",
        authorName: "Bob",
        createdAt: "2026-01-02T10:00:00.000Z",
      },
      {
        id: "c1",
        body: "Root body",
        parentId: null,
        authorName: "Alice",
        createdAt: "2026-01-01T10:00:00.000Z",
      },
    ])

    assert.match(markdown, /# Comments for ENG-1/)
    assert.match(markdown, /### Alice/)
    assert.match(markdown, /Root body/)
    assert.ok(markdown.indexOf("Root body") < markdown.indexOf("Reply body"))
    assert.match(markdown, /  ### Bob/)
    assert.match(markdown, /Reply body/)
  })

  test("shows empty state when there are no comments", () => {
    const markdown = formatLinearIssueCommentsMarkdown("ENG-2", [])

    assert.match(markdown, /No comments/)
  })

  test("truncates very long comment bodies", () => {
    const markdown = formatLinearIssueCommentsMarkdown("ENG-3", [
      {
        id: "c1",
        body: "x".repeat(MAX_COMMENT_BODY_CHARS + 50),
        parentId: null,
        authorName: "Alex",
      },
    ])

    assert.match(markdown, /truncated/)
    assert.ok(markdown.length < MAX_COMMENT_BODY_CHARS + 200)
  })
})

import * as assert from "assert"

import {
  parseIssueIdentifierFromPullRequest,
  parseIssueIdentifierFromText,
} from "../../utils/parseIssueIdentifier"

suite("parseIssueIdentifierFromText", () => {
  test("extracts a Linear issue identifier from PR titles", () => {
    assert.strictEqual(parseIssueIdentifierFromText("ENG-123 Fix login bug"), "ENG-123")
    assert.strictEqual(parseIssueIdentifierFromText("[PROJ-42] Add sidebar view"), "PROJ-42")
    assert.strictEqual(parseIssueIdentifierFromText("fix: eng-7 handle empty state"), "ENG-7")
  })

  test("returns undefined when no issue identifier is present", () => {
    assert.strictEqual(parseIssueIdentifierFromText("Fix login bug"), undefined)
    assert.strictEqual(parseIssueIdentifierFromText(""), undefined)
  })
})

suite("parseIssueIdentifierFromPullRequest", () => {
  test("prefers the PR title over the source branch", () => {
    assert.strictEqual(
      parseIssueIdentifierFromPullRequest({
        title: "ENG-10 Update docs",
        sourceBranch: "feature/eng-99-other",
      }),
      "ENG-10",
    )
  })

  test("falls back to the source branch when the title has no identifier", () => {
    assert.strictEqual(
      parseIssueIdentifierFromPullRequest({
        title: "Update docs",
        sourceBranch: "feature/eng-99-other",
      }),
      "ENG-99",
    )
  })
})

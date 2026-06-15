import * as assert from "assert"

import { buildPullRequestReviewPrompt } from "../../cursor/buildPullRequestReviewPrompt"

suite("buildPullRequestReviewPrompt", () => {
  test("references MCP pull request tools and linked issue when present", () => {
    const prompt = buildPullRequestReviewPrompt(
      {
        id: 7,
        url: "https://github.com/acme/app/pull/7",
        title: "ENG-42 Add feature",
        sourceBranch: "feature/eng-42",
        targetBranch: "main",
      },
      undefined,
      { editorLanguageLocale: "en" },
    )

    assert.match(prompt, /#7/)
    assert.match(prompt, /get_pull_request/)
    assert.match(prompt, /get_pull_request_diff/)
    assert.match(prompt, /sourceBranch "feature\/eng-42"/)
    assert.match(prompt, /targetBranch "main"/)
    assert.match(prompt, /ENG-42/)
    assert.match(prompt, /get_issue/)
    assert.match(prompt, /get_issue_comments/)
    assert.match(prompt, /source of truth/)
    assert.match(prompt, /implement the missing changes/)
    assert.match(prompt, /summary of changes/i)
    assert.match(prompt, /Security concerns/)
    assert.match(prompt, /clear and concise/i)
    assert.match(prompt, /code excerpt/i)
    assert.match(prompt, /proposed change/i)
    assert.match(prompt, /Respond in English/)
  })

  test("omits linked issue instructions when no identifier is found", () => {
    const prompt = buildPullRequestReviewPrompt({
      id: 3,
      url: "https://github.com/acme/app/pull/3",
      title: "Refactor internals",
      sourceBranch: "refactor/internals",
      targetBranch: "main",
    })

    assert.doesNotMatch(prompt, /get_issue/)
  })
})

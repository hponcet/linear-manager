import * as assert from "assert"

import { mapGitHubPullRequests } from "../../gitProviders/github/mapGitHubPullRequests"

suite("mapGitHubPullRequests", () => {
  test("maps GitHub pull request payloads", () => {
    const pullRequests = mapGitHubPullRequests([
      {
        number: 42,
        html_url: "https://github.com/acme/app/pull/42",
        title: "Add feature",
        draft: false,
        user: { login: "dev" },
        head: { ref: "feature/foo" },
        base: { ref: "main" },
      },
    ])

    assert.strictEqual(pullRequests.length, 1)
    assert.strictEqual(pullRequests[0]?.id, 42)
    assert.strictEqual(pullRequests[0]?.sourceBranch, "feature/foo")
    assert.strictEqual(pullRequests[0]?.targetBranch, "main")
    assert.strictEqual(pullRequests[0]?.authorLabel, "dev")
  })
})

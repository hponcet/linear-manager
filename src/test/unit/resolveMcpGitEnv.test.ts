import * as assert from "assert"

import { canUseLocalGitDiff, hasConfiguredGitRemote } from "../../mcp/gitMcpApi"
import { gitEnvFromRemote } from "../../mcp/resolveMcpGitEnv"

suite("resolveMcpGitEnv", () => {
  test("gitEnvFromRemote maps parsed remote and auth into MCP env keys", () => {
    const env = gitEnvFromRemote(
      {
        provider: "github",
        owner: "acme",
        repo: "widgets",
      },
      { accessToken: "gh-token" },
    )

    assert.strictEqual(env.GIT_PROVIDER, "github")
    assert.strictEqual(env.GIT_REMOTE_OWNER, "acme")
    assert.strictEqual(env.GIT_REMOTE_REPO, "widgets")
    assert.strictEqual(env.GIT_ACCESS_TOKEN, "gh-token")
  })
})

suite("gitMcpApi remote helpers", () => {
  test("hasConfiguredGitRemote requires provider owner and repo", () => {
    assert.strictEqual(
      hasConfiguredGitRemote({ provider: "github", owner: "acme", repo: "widgets" }),
      true,
    )
    assert.strictEqual(hasConfiguredGitRemote({ provider: "github" }), false)
  })

  test("canUseLocalGitDiff requires workspace folder and both branches", () => {
    assert.strictEqual(
      canUseLocalGitDiff({ workspaceFolder: "/repo" }, "feature/DES-186-keep-page-number", "main"),
      true,
    )
    assert.strictEqual(canUseLocalGitDiff({ workspaceFolder: "/repo" }, "feature/x"), false)
  })
})

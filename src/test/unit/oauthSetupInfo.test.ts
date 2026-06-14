import * as assert from "assert"

import {
  getBitbucketWorkspaceOAuthConsumersUrl,
  getOAuthSetupInfo,
} from "../../gitProviders/oauthSetupInfo"

suite("oauthSetupInfo", () => {
  test("builds workspace OAuth consumer URL from workspace slug", () => {
    assert.strictEqual(
      getBitbucketWorkspaceOAuthConsumersUrl("my-workspace"),
      "https://bitbucket.org/my-workspace/workspace/settings/oauth-consumers/new",
    )
  })

  test("describes Bitbucket API token setup without OAuth callback URL", () => {
    const setup = getOAuthSetupInfo("bitbucket", { authMethod: "apiToken" })

    assert.strictEqual(setup.signInLabel, "Connect with API token")
    assert.strictEqual(setup.redirectUri, undefined)
    assert.ok(setup.setupSteps?.some((step) => step.includes("API token")))
    assert.ok(setup.permissions?.includes("read:pullrequest:bitbucket"))
  })

  test("describes Bitbucket OAuth consumer in workspace settings", () => {
    const setup = getOAuthSetupInfo("bitbucket", {
      authMethod: "oauth",
      workspace: "acme",
    })

    assert.strictEqual(setup.signInLabel, "Sign in with Bitbucket")
    assert.ok(setup.redirectUri?.includes("bitbucket/oauth"))
    assert.strictEqual(
      setup.workspaceSetupUrl,
      "https://bitbucket.org/acme/workspace/settings/oauth-consumers/new",
    )
    assert.ok(setup.setupSteps?.some((step) => step.toLowerCase().includes("workspace")))
    assert.ok(setup.instructions?.toLowerCase().includes("workspace settings"))
  })
})

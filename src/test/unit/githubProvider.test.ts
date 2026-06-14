import * as assert from "assert"

import { GitHubProvider } from "../../gitProviders/github/GitHubProvider"
import { GitProviderSecretKeys } from "../../gitProviders/secrets"

function createProvider(secrets: Map<string, string>) {
  return new GitHubProvider({
    secrets: {
      get: async (key: string) => secrets.get(key),
      store: async (key: string, value: string) => {
        secrets.set(key, value)
      },
      delete: async (key: string) => {
        secrets.delete(key)
      },
    },
  } as never)
}

suite("GitHubProvider", () => {
  test("getAuthState returns disconnected when the extension link secret is missing", async () => {
    const provider = createProvider(new Map())

    const state = await provider.getAuthState()

    assert.strictEqual(state.connected, false)
  })

  test("disconnect clears the extension link so getAuthState is disconnected", async () => {
    const secrets = new Map<string, string>([[GitProviderSecretKeys.githubAccount, "octocat"]])
    const provider = createProvider(secrets)

    await provider.disconnect()

    const state = await provider.getAuthState()

    assert.strictEqual(state.connected, false)
    assert.strictEqual(secrets.has(GitProviderSecretKeys.githubAccount), false)
  })
})

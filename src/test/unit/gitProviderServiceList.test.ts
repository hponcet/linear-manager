import * as assert from "assert"

import { GitProviderService } from "../../gitProviders/GitProviderService"

function createService(options: {
  settings?: Record<string, unknown>
  originRemote?: { fetchUrl?: string; pushUrl?: string } | null
}) {
  const context = {
    globalState: {
      get: () => options.settings ?? {},
    },
    secrets: {
      get: async () => undefined,
      store: async () => undefined,
      delete: async () => undefined,
    },
  } as never

  const gitClient = {
    getOriginRemote: () =>
      options.originRemote === undefined
        ? { fetchUrl: "https://github.com/acme/app.git" }
        : options.originRemote,
  } as never

  return new GitProviderService(context, gitClient)
}

suite("GitProviderService.listOpenPullRequests", () => {
  test("returns error when no git provider is configured", async () => {
    const service = createService({ settings: {} })
    const result = await service.listOpenPullRequests()

    assert.strictEqual(result.pullRequests.length, 0)
    assert.match(result.error ?? "", /Select a git provider in Settings/i)
  })

  test("returns error when no git remote is found", async () => {
    const service = createService({
      settings: { gitProvider: "github" },
      originRemote: null,
    })
    const result = await service.listOpenPullRequests()

    assert.strictEqual(result.pullRequests.length, 0)
    assert.match(result.error ?? "", /No git remote found/i)
  })

  test("returns error when provider does not match repository remote", async () => {
    const service = createService({
      settings: { gitProvider: "bitbucket" },
      originRemote: { fetchUrl: "https://github.com/acme/app.git" },
    })
    const result = await service.listOpenPullRequests()

    assert.strictEqual(result.pullRequests.length, 0)
    assert.match(result.error ?? "", /does not match the repository remote/i)
  })

  test("returns error when provider is not connected", async () => {
    const service = createService({
      settings: { gitProvider: "github" },
    })
    const result = await service.listOpenPullRequests()

    assert.strictEqual(result.pullRequests.length, 0)
    assert.match(result.error ?? "", /Connect to GitHub/i)
  })
})

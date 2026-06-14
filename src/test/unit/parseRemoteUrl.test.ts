import * as assert from "assert"

import { BitbucketProvider } from "../../gitProviders/bitbucket/BitbucketProvider"
import { GitHubProvider } from "../../gitProviders/github/GitHubProvider"
import { GitLabProvider } from "../../gitProviders/gitlab/GitLabProvider"
import { parseRemoteUrl } from "../../gitProviders/parseRemoteUrl"

suite("parseRemoteUrl", () => {
  test("parses GitHub HTTPS remotes", () => {
    assert.deepStrictEqual(parseRemoteUrl("https://github.com/acme/app.git"), {
      provider: "github",
      owner: "acme",
      repo: "app",
    })
  })

  test("parses GitHub SSH remotes", () => {
    assert.deepStrictEqual(parseRemoteUrl("git@github.com:acme/app.git"), {
      provider: "github",
      owner: "acme",
      repo: "app",
    })
  })

  test("parses GitLab nested groups", () => {
    assert.deepStrictEqual(parseRemoteUrl("git@gitlab.com:group/subgroup/project.git"), {
      provider: "gitlab",
      owner: "group/subgroup",
      repo: "project",
    })
  })

  test("parses Bitbucket Cloud remotes", () => {
    assert.deepStrictEqual(parseRemoteUrl("https://bitbucket.org/workspace/repo.git"), {
      provider: "bitbucket",
      owner: "workspace",
      repo: "repo",
    })
  })

  test("uses gitlab fallback provider for self-hosted remotes", () => {
    assert.deepStrictEqual(parseRemoteUrl("git@git.company.com:group/project.git", "gitlab"), {
      provider: "gitlab",
      owner: "group",
      repo: "project",
      host: "https://git.company.com",
    })
  })

  test("returns null for unsupported remotes", () => {
    assert.strictEqual(parseRemoteUrl("https://example.com/a/b.git"), null)
  })
})

suite("buildCreatePullRequestUrl", () => {
  const remote = {
    provider: "github" as const,
    owner: "acme",
    repo: "app",
  }

  test("builds GitHub compare URLs with encoded title and body", () => {
    const provider = Object.create(GitHubProvider.prototype) as GitHubProvider
    const url = provider.buildCreatePullRequestUrl({
      remote,
      sourceBranch: "feature/foo",
      targetBranch: "main",
      title: "[ENG-1] Fix bug",
      body: "https://linear.app/issue/ENG-1",
    })

    assert.match(url, /^https:\/\/github\.com\/acme\/app\/compare\/main\.\.\.feature%2Ffoo/)
    assert.match(url, /quick_pull=1/)
    assert.match(url, /title=%5BENG-1%5D\+Fix\+bug/)
  })

  test("builds GitLab merge request URLs", () => {
    const provider = Object.create(GitLabProvider.prototype) as GitLabProvider
    const url = provider.buildCreatePullRequestUrl({
      remote: { provider: "gitlab", owner: "group", repo: "project" },
      sourceBranch: "feature/foo",
      targetBranch: "main",
      title: "Title",
      body: "Body",
    })

    assert.match(url, /merge_request%5Bsource_branch%5D=feature%2Ffoo/)
    assert.match(url, /merge_request%5Btarget_branch%5D=main/)
  })

  test("builds Bitbucket pull request URLs", () => {
    const provider = Object.create(BitbucketProvider.prototype) as BitbucketProvider
    const url = provider.buildCreatePullRequestUrl({
      remote: { provider: "bitbucket", owner: "workspace", repo: "repo" },
      sourceBranch: "feature/foo",
      targetBranch: "main",
      title: "Title",
      body: "Body",
    })

    assert.match(url, /source=feature%2Ffoo/)
    assert.match(url, /dest=main/)
  })
})

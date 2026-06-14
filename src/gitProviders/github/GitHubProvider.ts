import { authentication, ExtensionContext, window } from "vscode"

import { GitProvider } from "../GitProvider"
import { GitProviderSecretKeys } from "../secrets"
import {
  CreatePullRequestUrlInput,
  FindPullRequestInput,
  GitProviderAuthState,
  ParsedRemote,
  PullRequestInfo,
} from "../types"

const GITHUB_SCOPES = ["read:user", "repo"]

export class GitHubProvider extends GitProvider {
  readonly providerId = "github" as const
  readonly displayName = "GitHub"

  constructor(private readonly context: ExtensionContext) {
    super()
  }

  async connect(): Promise<GitProviderAuthState> {
    window.showInformationMessage(
      "Opening GitHub sign-in. If GitHub shows Visual Studio Code, that is expected — Cursor uses VS Code's GitHub integration.",
    )

    const session = await authentication.getSession("github", GITHUB_SCOPES, {
      createIfNone: true,
    })

    if (!session) {
      return { connected: false }
    }

    await this.context.secrets.store(GitProviderSecretKeys.githubAccount, session.account.label)

    return {
      connected: true,
      accountLabel: session.account.label,
    }
  }

  async disconnect(): Promise<void> {
    await this.context.secrets.delete(GitProviderSecretKeys.githubAccount)
  }

  async getAuthState(): Promise<GitProviderAuthState> {
    const linkedAccount = await this.context.secrets.get(GitProviderSecretKeys.githubAccount)
    if (!linkedAccount) {
      return { connected: false }
    }

    const session = await authentication.getSession("github", GITHUB_SCOPES, {
      createIfNone: false,
    })

    if (!session) {
      await this.context.secrets.delete(GitProviderSecretKeys.githubAccount)
      return { connected: false }
    }

    return {
      connected: true,
      accountLabel: session.account.label,
    }
  }

  async findPullRequest(input: FindPullRequestInput): Promise<PullRequestInfo | null> {
    const session = await authentication.getSession("github", GITHUB_SCOPES, {
      createIfNone: false,
    })
    if (!session) return null

    const { remote, sourceBranch } = input
    const head = `${remote.owner}:${sourceBranch}`
    const url = `https://api.github.com/repos/${remote.owner}/${remote.repo}/pulls?head=${encodeURIComponent(head)}&state=open`

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) return null

    const pulls = (await response.json()) as Array<{
      number: number
      html_url: string
      title: string
    }>
    const pull = pulls[0]
    if (!pull) return null

    return {
      id: pull.number,
      url: pull.html_url,
      title: pull.title,
    }
  }

  buildCreatePullRequestUrl(input: CreatePullRequestUrlInput): string {
    const { remote, sourceBranch, targetBranch, title, body } = input
    const compareUrl = new URL(
      `https://github.com/${remote.owner}/${remote.repo}/compare/${encodeURIComponent(targetBranch)}...${encodeURIComponent(sourceBranch)}`,
    )
    compareUrl.searchParams.set("quick_pull", "1")
    compareUrl.searchParams.set("title", title)
    compareUrl.searchParams.set("body", body)
    return compareUrl.toString()
  }

  matchesRemote(remote: ParsedRemote): boolean {
    return remote.provider === "github"
  }
}

import { ExtensionContext, window } from "vscode"

import { getAuthenticationConfiguration } from "./extensionConfig"
import { GitlabOAuth } from "./gitlabOAuth"

import { VscStateKeys, SettingsVscState } from "../../vscStates"
import { GitProvider } from "../GitProvider"
import { formatGitLabMissingClientIdMessage } from "../oauthSetupInfo"
import { GitProviderSecretKeys, StoredGitLabTokens } from "../secrets"
import {
  CreatePullRequestUrlInput,
  FindPullRequestInput,
  GitProviderAuthState,
  ParsedRemote,
  PullRequestInfo,
} from "../types"

const DEFAULT_GITLAB_INSTANCE = "https://gitlab.com"

export class GitLabProvider extends GitProvider {
  readonly providerId = "gitlab" as const
  readonly displayName = "GitLab"

  #oauth = new GitlabOAuth()

  constructor(private readonly context: ExtensionContext) {
    super()
  }

  private getInstanceUrl(): string {
    const settings = this.context.globalState.get<SettingsVscState>(VscStateKeys.branchesSettings)
    return settings?.gitlabInstanceUrl?.replace(/\/$/, "") || DEFAULT_GITLAB_INSTANCE
  }

  async connect(): Promise<GitProviderAuthState> {
    const instanceUrl = this.getInstanceUrl()

    if (!this.#oauth.supportsGitLabInstance(instanceUrl)) {
      window.showErrorMessage(formatGitLabMissingClientIdMessage(instanceUrl))
      return { connected: false }
    }

    window.showInformationMessage(
      "Opening GitLab sign-in in your browser. Complete SSO and return to VS Code.",
    )

    const tokens = await this.#oauth.authenticate(instanceUrl)
    if (!tokens) {
      return { connected: false }
    }

    const accountLabel = await this.fetchAccountLabel(instanceUrl, tokens.access_token)
    const stored = await this.getStoredTokens()
    stored[instanceUrl] = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
      account_label: accountLabel,
    }
    await this.context.secrets.store(GitProviderSecretKeys.gitlabTokens, JSON.stringify(stored))

    return {
      connected: true,
      accountLabel,
    }
  }

  async disconnect(): Promise<void> {
    const instanceUrl = this.getInstanceUrl()
    const stored = await this.getStoredTokens()
    delete stored[instanceUrl]
    await this.context.secrets.store(GitProviderSecretKeys.gitlabTokens, JSON.stringify(stored))
  }

  async getAuthState(): Promise<GitProviderAuthState> {
    const instanceUrl = this.getInstanceUrl()
    const token = await this.getValidAccessToken(instanceUrl)
    if (!token) {
      return { connected: false }
    }

    const stored = await this.getStoredTokens()
    return {
      connected: true,
      accountLabel: stored[instanceUrl]?.account_label,
    }
  }

  async findPullRequest(input: FindPullRequestInput): Promise<PullRequestInfo | null> {
    const instanceUrl = input.remote.host ?? DEFAULT_GITLAB_INSTANCE
    const accessToken = await this.getValidAccessToken(instanceUrl)
    if (!accessToken) return null

    const projectPath = encodeURIComponent(`${input.remote.owner}/${input.remote.repo}`)
    const url = `${instanceUrl}/api/v4/projects/${projectPath}/merge_requests?source_branch=${encodeURIComponent(input.sourceBranch)}&state=opened`

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) return null

    const mergeRequests = (await response.json()) as Array<{
      iid: number
      web_url: string
      title: string
    }>
    const mr = mergeRequests[0]
    if (!mr) return null

    return {
      id: mr.iid,
      url: mr.web_url,
      title: mr.title,
    }
  }

  buildCreatePullRequestUrl(input: CreatePullRequestUrlInput): string {
    const host = (input.remote.host ?? DEFAULT_GITLAB_INSTANCE).replace(/\/$/, "")
    const projectPath = `${input.remote.owner}/${input.remote.repo}`
    const url = new URL(`${host}/${projectPath}/-/merge_requests/new`)
    url.searchParams.set("merge_request[source_branch]", input.sourceBranch)
    url.searchParams.set("merge_request[target_branch]", input.targetBranch)
    url.searchParams.set("merge_request[title]", input.title)
    url.searchParams.set("merge_request[description]", input.body)
    return url.toString()
  }

  matchesRemote(remote: ParsedRemote): boolean {
    return remote.provider === "gitlab"
  }

  private async getStoredTokens(): Promise<StoredGitLabTokens> {
    const raw = await this.context.secrets.get(GitProviderSecretKeys.gitlabTokens)
    if (!raw) return {}
    try {
      return JSON.parse(raw) as StoredGitLabTokens
    } catch {
      return {}
    }
  }

  private async getValidAccessToken(instanceUrl: string): Promise<string | null> {
    const stored = await this.getStoredTokens()
    const entry = stored[instanceUrl]
    if (!entry) return null

    if (entry.expires_at > Date.now() + 60_000) {
      return entry.access_token
    }

    if (!this.#oauth.supportsGitLabInstance(instanceUrl)) {
      return null
    }

    try {
      const clientId = getAuthenticationConfiguration().oauthClientIds[instanceUrl] || ""
      const refreshed = await this.#oauth.exchangeToken(
        {
          instanceUrl,
          grantType: "refresh_token",
          refreshToken: entry.refresh_token,
        },
        clientId,
      )
      stored[instanceUrl] = {
        ...entry,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: Date.now() + refreshed.expires_in * 1000,
      }
      await this.context.secrets.store(GitProviderSecretKeys.gitlabTokens, JSON.stringify(stored))
      return refreshed.access_token
    } catch {
      return null
    }
  }

  private async fetchAccountLabel(instanceUrl: string, accessToken: string): Promise<string> {
    try {
      const response = await fetch(`${instanceUrl}/api/v4/user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(30000),
      })
      if (!response.ok) return "GitLab user"
      const user = (await response.json()) as { username?: string; email?: string }
      return user.username || user.email || "GitLab user"
    } catch {
      return "GitLab user"
    }
  }
}

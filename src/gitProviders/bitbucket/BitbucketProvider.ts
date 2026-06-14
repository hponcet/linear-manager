import { ExtensionContext, window } from "vscode"

import {
  buildBitbucketApiTokenAuthHeader,
  buildBitbucketOAuthAuthHeader,
  normalizeBitbucketApiToken,
} from "./bitbucketAuth"
import { BitbucketOAuth } from "./bitbucketOAuth"

import { SettingsVscState, VscStateKeys } from "../../vscStates"
import { GitProvider } from "../GitProvider"
import {
  formatBitbucketMissingApiTokenMessage,
  formatBitbucketMissingClientIdMessage,
  formatBitbucketMissingEmailMessage,
} from "../oauthSetupInfo"
import { GitProviderSecretKeys, StoredBitbucketTokens } from "../secrets"
import {
  CreatePullRequestUrlInput,
  FindPullRequestInput,
  GitProviderAuthState,
  ParsedRemote,
  PullRequestInfo,
} from "../types"

export type BitbucketConnectCredentials = {
  bitbucketApiToken?: string
  bitbucketOAuthClientSecret?: string
}

export class BitbucketProvider extends GitProvider {
  readonly providerId = "bitbucket" as const
  readonly displayName = "Bitbucket"

  #oauth = new BitbucketOAuth()

  constructor(private readonly context: ExtensionContext) {
    super()
  }

  async connect(credentials?: Record<string, string | undefined>): Promise<GitProviderAuthState> {
    const settings = this.getSettings()
    const authMethod = settings.bitbucketAuthMethod ?? "apiToken"

    if (authMethod === "apiToken") {
      return this.connectWithApiToken(credentials?.bitbucketApiToken)
    }

    return this.connectWithOAuth(credentials?.bitbucketOAuthClientSecret)
  }

  async disconnect(): Promise<void> {
    await this.context.secrets.delete(GitProviderSecretKeys.bitbucketTokens)
    await this.context.secrets.delete(GitProviderSecretKeys.bitbucketClientSecret)
    await this.context.secrets.delete(GitProviderSecretKeys.bitbucketApiToken)
  }

  async getAuthState(): Promise<GitProviderAuthState> {
    const token = await this.getValidAccessToken()
    if (!token) {
      return { connected: false }
    }

    const settings = this.getSettings()
    const authMethod = settings.bitbucketAuthMethod ?? "apiToken"

    if (authMethod === "apiToken") {
      const accountLabel =
        (await this.fetchAccountLabel(token)) ?? settings.bitbucketAtlassianEmail?.trim()
      return { connected: true, accountLabel: accountLabel ?? undefined }
    }

    const stored = await this.getStoredOAuthTokens()
    return {
      connected: true,
      accountLabel: stored?.account_label,
    }
  }

  async findPullRequest(input: FindPullRequestInput): Promise<PullRequestInfo | null> {
    const accessToken = await this.getValidAccessToken()
    if (!accessToken) return null

    const { remote, sourceBranch } = input
    const url = `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests?q=${encodeURIComponent(`source.branch.name="${sourceBranch}" AND state="OPEN"`)}`

    const response = await this.authenticatedFetch(url, accessToken)
    if (!response?.ok) return null

    const data = (await response.json()) as {
      values?: Array<{ id: number; links: { html: { href: string } }; title: string }>
    }
    const pr = data.values?.[0]
    if (!pr) return null

    return {
      id: pr.id,
      url: pr.links.html.href,
      title: pr.title,
    }
  }

  async listOpenPullRequests(remote: ParsedRemote): Promise<PullRequestInfo[]> {
    const accessToken = await this.getValidAccessToken()
    if (!accessToken) {
      throw new Error("Bitbucket access token is not available.")
    }

    const url = `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests?q=${encodeURIComponent('state="OPEN"')}&pagelen=50`
    const response = await this.authenticatedFetch(url, accessToken)
    if (!response) {
      throw new Error("Bitbucket credentials are not configured.")
    }

    if (!response.ok) {
      const detail = await this.readBitbucketError(response)
      throw new Error(`Bitbucket API error: ${detail}`)
    }

    const data = (await response.json()) as {
      values?: Array<{
        id: number
        title: string
        links: { html: { href: string } }
        source?: { branch?: { name?: string } }
        destination?: { branch?: { name?: string } }
        author?: { display_name?: string; nickname?: string }
      }>
    }

    return (data.values ?? []).map((pr) => ({
      id: pr.id,
      url: pr.links.html.href,
      title: pr.title,
      sourceBranch: pr.source?.branch?.name,
      targetBranch: pr.destination?.branch?.name,
      authorLabel: pr.author?.display_name || pr.author?.nickname,
    }))
  }

  buildCreatePullRequestUrl(input: CreatePullRequestUrlInput): string {
    const url = new URL(
      `https://bitbucket.org/${input.remote.owner}/${input.remote.repo}/pull-requests/new`,
    )
    url.searchParams.set("source", input.sourceBranch)
    url.searchParams.set("dest", input.targetBranch)
    url.searchParams.set("title", input.title)
    url.searchParams.set("description", input.body)
    return url.toString()
  }

  matchesRemote(remote: ParsedRemote): boolean {
    return remote.provider === "bitbucket"
  }

  private getSettings(): SettingsVscState {
    return this.context.globalState.get<SettingsVscState>(VscStateKeys.branchesSettings) ?? {}
  }

  private buildAuthorizationHeader(accessToken: string): string | null {
    const settings = this.getSettings()
    const authMethod = settings.bitbucketAuthMethod ?? "apiToken"

    if (authMethod === "apiToken") {
      const email = settings.bitbucketAtlassianEmail?.trim()
      if (!email) return null
      return buildBitbucketApiTokenAuthHeader(email, accessToken)
    }

    return buildBitbucketOAuthAuthHeader(accessToken)
  }

  private async authenticatedFetch(url: string, accessToken: string): Promise<Response | null> {
    const authorization = this.buildAuthorizationHeader(accessToken)
    if (!authorization) return null

    try {
      return await fetch(url, {
        headers: {
          Authorization: authorization,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30000),
      })
    } catch {
      return null
    }
  }

  private async connectWithApiToken(pastedToken?: string): Promise<GitProviderAuthState> {
    const settings = this.getSettings()
    const email = settings.bitbucketAtlassianEmail?.trim()
    if (!email) {
      window.showErrorMessage(formatBitbucketMissingEmailMessage())
      return { connected: false }
    }

    let apiToken =
      pastedToken?.trim() ||
      (await this.context.secrets.get(GitProviderSecretKeys.bitbucketApiToken))

    if (!apiToken) {
      apiToken = await window.showInputBox({
        title: "Bitbucket API token",
        prompt: "Paste your Bitbucket HTTP access token (Account settings → Security → API tokens)",
        password: true,
        ignoreFocusOut: true,
      })

      if (!apiToken?.trim()) {
        window.showErrorMessage(formatBitbucketMissingApiTokenMessage())
        return { connected: false }
      }
    }

    apiToken = normalizeBitbucketApiToken(apiToken)
    const response = await this.authenticatedFetch("https://api.bitbucket.org/2.0/user", apiToken)

    if (!response?.ok) {
      const detail = await this.readBitbucketError(response)
      window.showErrorMessage(
        `Bitbucket API token was rejected (${detail}). Use your Atlassian account email (not Bitbucket username) with the token, and scopes read:pullrequest:bitbucket and read:user:bitbucket.`,
      )
      await this.context.secrets.delete(GitProviderSecretKeys.bitbucketApiToken)
      return { connected: false }
    }

    const user = (await response.json()) as { username?: string; display_name?: string }
    const accountLabel = user.display_name || user.username || email

    await this.context.secrets.store(GitProviderSecretKeys.bitbucketApiToken, apiToken)
    return { connected: true, accountLabel }
  }

  private async connectWithOAuth(pastedSecret?: string): Promise<GitProviderAuthState> {
    const settings = this.getSettings()
    const clientId = settings.bitbucketOAuthClientId?.trim()
    if (!clientId) {
      window.showErrorMessage(formatBitbucketMissingClientIdMessage())
      return { connected: false }
    }

    let clientSecret =
      pastedSecret?.trim() ||
      (await this.context.secrets.get(GitProviderSecretKeys.bitbucketClientSecret))

    if (!clientSecret) {
      clientSecret = await window.showInputBox({
        title: "Bitbucket OAuth consumer Secret",
        prompt:
          "Enter the Secret from your workspace OAuth consumer (expand the consumer after saving to reveal it)",
        password: true,
        ignoreFocusOut: true,
      })

      if (!clientSecret?.trim()) {
        return { connected: false }
      }
    }

    clientSecret = clientSecret.trim()
    await this.context.secrets.store(GitProviderSecretKeys.bitbucketClientSecret, clientSecret)

    window.showInformationMessage(
      "Opening Bitbucket sign-in in your browser. Complete SSO and return to VS Code.",
    )

    try {
      const tokens = await this.#oauth.authenticate(clientId, clientSecret)
      const accountLabel = await this.fetchAccountLabel(tokens.access_token)

      const stored: StoredBitbucketTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
        account_label: accountLabel ?? undefined,
      }
      await this.context.secrets.store(
        GitProviderSecretKeys.bitbucketTokens,
        JSON.stringify(stored),
      )

      return {
        connected: true,
        accountLabel: accountLabel ?? undefined,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.showErrorMessage(`Bitbucket sign-in failed: ${message}`)
      return { connected: false }
    }
  }

  private async getStoredOAuthTokens(): Promise<StoredBitbucketTokens | null> {
    const raw = await this.context.secrets.get(GitProviderSecretKeys.bitbucketTokens)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredBitbucketTokens
    } catch {
      return null
    }
  }

  private async getValidAccessToken(): Promise<string | null> {
    const settings = this.getSettings()
    const authMethod = settings.bitbucketAuthMethod ?? "apiToken"

    if (authMethod === "apiToken") {
      const token = await this.context.secrets.get(GitProviderSecretKeys.bitbucketApiToken)
      return token ? normalizeBitbucketApiToken(token) : null
    }

    const stored = await this.getStoredOAuthTokens()
    if (!stored) return null

    if (stored.expires_at > Date.now() + 60_000) {
      return stored.access_token
    }

    const clientId = settings.bitbucketOAuthClientId?.trim()
    const clientSecret = await this.context.secrets.get(GitProviderSecretKeys.bitbucketClientSecret)
    if (!clientId || !clientSecret) return null

    try {
      const refreshed = await this.#oauth.refreshToken(stored.refresh_token, clientId, clientSecret)
      const updated: StoredBitbucketTokens = {
        ...stored,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: Date.now() + refreshed.expires_in * 1000,
      }
      await this.context.secrets.store(
        GitProviderSecretKeys.bitbucketTokens,
        JSON.stringify(updated),
      )
      return refreshed.access_token
    } catch {
      return null
    }
  }

  private async fetchAccountLabel(accessToken: string): Promise<string | null> {
    const response = await this.authenticatedFetch(
      "https://api.bitbucket.org/2.0/user",
      accessToken,
    )
    if (!response?.ok) return null

    try {
      const user = (await response.json()) as { username?: string; display_name?: string }
      return user.display_name || user.username || null
    } catch {
      return null
    }
  }

  private async readBitbucketError(response: Response | null | undefined): Promise<string> {
    if (!response) return "missing credentials"
    try {
      const body = (await response.json()) as { error?: { message?: string } }
      return body.error?.message ?? `HTTP ${response.status}`
    } catch {
      return `HTTP ${response.status}`
    }
  }
}

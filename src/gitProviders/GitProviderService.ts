import { env, EventEmitter, ExtensionContext, Uri, window } from "vscode"

import { GitProviderRegistry } from "./GitProviderRegistry"
import { getOAuthSetupInfo, GitProviderOAuthSetup } from "./oauthSetupInfo"
import { parseRemoteUrl } from "./parseRemoteUrl"
import {
  GitProviderId,
  GitProviderStatus,
  ListPullRequestsResult,
  OpenPullRequestResult,
  ParsedRemote,
  PullRequestStatus,
  BitbucketAuthMethod,
} from "./types"

import { CommandContext, setCommandContext } from "../commandsContext"
import { GitClient } from "../git/GitClient"
import { pickTargetBranch } from "../git/pickTargetBranch"
import { VscStateKeys, SettingsVscState } from "../vscStates"

type IssuePullRequestContext = {
  identifier: string
  title: string
  url: string
}

export class GitProviderService {
  readonly registry: GitProviderRegistry

  #onAuthContextChanged = new EventEmitter<void>()
  readonly onAuthContextChanged = this.#onAuthContextChanged.event

  constructor(
    private readonly context: ExtensionContext,
    private readonly gitClient: GitClient,
  ) {
    this.registry = new GitProviderRegistry(context)
  }

  async initialize(): Promise<void> {
    await this.refreshAuthContext()
  }

  private getSettings(): SettingsVscState {
    return this.context.globalState.get<SettingsVscState>(VscStateKeys.branchesSettings) ?? {}
  }

  private getActiveProvider() {
    const settings = this.getSettings()
    if (!settings.gitProvider) return null
    return this.registry.getProvider(settings.gitProvider)
  }

  getParsedOriginRemote(): ParsedRemote | null {
    const remote = this.gitClient.getOriginRemote()
    const settings = this.getSettings()
    return parseRemoteUrl(remote?.fetchUrl ?? remote?.pushUrl, settings.gitProvider)
  }

  getOAuthSetup(
    providerId?: GitProviderId,
    options?: { bitbucketAuthMethod?: BitbucketAuthMethod },
  ): GitProviderOAuthSetup | null {
    const settings = this.getSettings()
    const id = providerId ?? settings.gitProvider
    if (!id) return null

    if (id === "bitbucket") {
      const remote = this.getParsedOriginRemote()
      return getOAuthSetupInfo(id, {
        authMethod: options?.bitbucketAuthMethod ?? settings.bitbucketAuthMethod ?? "apiToken",
        workspace: remote?.provider === "bitbucket" ? remote.owner : undefined,
      })
    }

    return getOAuthSetupInfo(id)
  }

  async getStatus(): Promise<GitProviderStatus> {
    const settings = this.getSettings()
    const remote = this.getParsedOriginRemote()
    const providerId = settings.gitProvider

    if (!providerId) {
      return {
        connected: false,
        remoteMatchesProvider: false,
        remote: remote ?? undefined,
      }
    }

    const provider = this.registry.getProvider(providerId)
    const auth = await provider.getAuthState()

    return {
      provider: providerId,
      connected: auth.connected,
      accountLabel: auth.accountLabel,
      remote: remote ?? undefined,
      remoteMatchesProvider: remote ? provider.matchesRemote(remote) : true,
    }
  }

  async connect(credentials?: {
    bitbucketApiToken?: string
    bitbucketOAuthClientSecret?: string
  }): Promise<void> {
    const provider = this.getActiveProvider()
    if (!provider) {
      window.showWarningMessage("Select a git provider in Settings first.")
      return
    }

    const auth = await provider.connect(
      credentials
        ? {
            bitbucketApiToken: credentials.bitbucketApiToken,
            bitbucketOAuthClientSecret: credentials.bitbucketOAuthClientSecret,
          }
        : undefined,
    )
    if (auth.connected) {
      window.showInformationMessage(
        `Signed in to ${provider.displayName}${auth.accountLabel ? ` as ${auth.accountLabel}` : ""}.`,
      )
    }
    await this.refreshAuthContext()
  }

  async disconnect(): Promise<void> {
    const provider = this.getActiveProvider()
    if (!provider) return

    await provider.disconnect()
    window.showInformationMessage(`Signed out from ${provider.displayName}.`)
    await this.refreshAuthContext()
  }

  async getPullRequestStatus(sourceBranch: string): Promise<PullRequestStatus> {
    const provider = this.getActiveProvider()
    const remote = this.getParsedOriginRemote()

    if (!provider || !remote || !provider.matchesRemote(remote)) {
      return { exists: false }
    }

    const auth = await provider.getAuthState()
    if (!auth.connected) {
      return { exists: false }
    }

    const pullRequest = await provider.findPullRequest({ remote, sourceBranch })
    return {
      exists: Boolean(pullRequest),
      pullRequest: pullRequest ?? undefined,
    }
  }

  async listOpenPullRequests(): Promise<ListPullRequestsResult> {
    const provider = this.getActiveProvider()
    const remote = this.getParsedOriginRemote()

    if (!provider) {
      return { pullRequests: [], error: "Select a git provider in Settings." }
    }

    if (!remote) {
      return { pullRequests: [], error: "No git remote found for this repository." }
    }

    if (!provider.matchesRemote(remote)) {
      return {
        pullRequests: [],
        error: `The configured provider (${provider.displayName}) does not match the repository remote.`,
      }
    }

    const auth = await provider.getAuthState()
    if (!auth.connected) {
      return {
        pullRequests: [],
        error: `Connect to ${provider.displayName} in Settings first.`,
      }
    }

    try {
      const pullRequests = await provider.listOpenPullRequests(remote)
      pullRequests.sort((a, b) =>
        (a.title ?? String(a.id)).localeCompare(b.title ?? String(b.id), undefined, {
          sensitivity: "base",
        }),
      )
      return { pullRequests }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { pullRequests: [], error: message }
    }
  }

  async openPullRequestForIssue(
    issue: IssuePullRequestContext,
    sourceBranch: string,
  ): Promise<OpenPullRequestResult> {
    const provider = this.getActiveProvider()
    const remote = this.getParsedOriginRemote()

    if (!provider) {
      window.showWarningMessage("Select a git provider in Settings first.")
      return { action: "cancelled" }
    }

    if (!remote) {
      window.showWarningMessage("Could not parse the git remote URL for this repository.")
      return { action: "cancelled" }
    }

    if (!provider.matchesRemote(remote)) {
      window.showWarningMessage(
        `The configured provider (${provider.displayName}) does not match the repository remote.`,
      )
      return { action: "cancelled" }
    }

    const auth = await provider.getAuthState()
    if (!auth.connected) {
      window.showWarningMessage(`Connect to ${provider.displayName} in Settings first.`)
      return { action: "cancelled" }
    }

    const existing = await provider.findPullRequest({ remote, sourceBranch })
    if (existing) {
      await env.openExternal(Uri.parse(existing.url))
      return { action: "view", url: existing.url }
    }

    const branches = await this.gitClient.getBranches({ remote: true })
    const targetBranch = await pickTargetBranch({
      sourceBranch,
      branches,
      defaultBranch: this.gitClient.getDefaultBranch(),
    })

    if (!targetBranch) {
      return { action: "cancelled" }
    }

    const url = provider.buildCreatePullRequestUrl({
      remote,
      sourceBranch,
      targetBranch,
      title: `[${issue.identifier}] ${issue.title}`,
      body: `${issue.url}\n\n---\n\nCreated from Linear Manager`,
    })

    await env.openExternal(Uri.parse(url))
    return { action: "create", url }
  }

  async refreshAuthContext(): Promise<void> {
    const status = await this.getStatus()
    const isAuthenticated = Boolean(status.provider && status.connected)
    await setCommandContext(CommandContext.gitProviderAuthenticated, isAuthenticated)
    this.#onAuthContextChanged.fire()
  }
}

export type GitProviderId = "github" | "gitlab" | "bitbucket"

export type GitProviderOAuthSetup = {
  signInLabel: string
  redirectUri?: string
  instructions: string
  /** @deprecated Prefer `permissions` — Bitbucket OAuth uses consumer permissions, not URL scopes. */
  scopes?: string
  permissions?: string
  setupSteps?: string[]
  docsUrl?: string
  workspaceSetupUrl?: string
}

export type BitbucketAuthMethod = "apiToken" | "oauth"

export type ParsedRemote = {
  provider: GitProviderId
  owner: string
  repo: string
  host?: string
}

export type GitProviderAuthState = {
  connected: boolean
  accountLabel?: string
}

export type FindPullRequestInput = {
  remote: ParsedRemote
  sourceBranch: string
}

export type CreatePullRequestUrlInput = {
  remote: ParsedRemote
  sourceBranch: string
  targetBranch: string
  title: string
  body: string
}

export type PullRequestInfo = {
  id: string | number
  url: string
  title?: string
  sourceBranch?: string
  targetBranch?: string
  authorLabel?: string
  draft?: boolean
}

export type ListPullRequestsResult = {
  pullRequests: PullRequestInfo[]
  error?: string
}

export type GitProviderStatus = {
  provider?: GitProviderId
  connected: boolean
  accountLabel?: string
  remote?: ParsedRemote
  remoteMatchesProvider: boolean
}

export type OpenPullRequestResult = {
  action: "view" | "create" | "cancelled"
  url?: string
}

export type PullRequestStatus = {
  exists: boolean
  pullRequest?: PullRequestInfo
}

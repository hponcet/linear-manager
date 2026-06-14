import {
  CreatePullRequestUrlInput,
  FindPullRequestInput,
  GitProviderAuthState,
  GitProviderId,
  ParsedRemote,
  PullRequestInfo,
} from "./types"

export abstract class GitProvider {
  abstract readonly providerId: GitProviderId
  abstract readonly displayName: string

  abstract connect(credentials?: Record<string, string | undefined>): Promise<GitProviderAuthState>
  abstract disconnect(): Promise<void>
  abstract getAuthState(): Promise<GitProviderAuthState>
  abstract findPullRequest(input: FindPullRequestInput): Promise<PullRequestInfo | null>
  abstract buildCreatePullRequestUrl(input: CreatePullRequestUrlInput): string
  abstract matchesRemote(remote: ParsedRemote): boolean
}

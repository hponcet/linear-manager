export enum GitProviderSecretKeys {
  githubAccount = "gitProviderGithubAccount",
  gitlabTokens = "gitProviderGitlabTokens",
  bitbucketTokens = "gitProviderBitbucketTokens",
  bitbucketClientSecret = "gitProviderBitbucketClientSecret",
  bitbucketApiToken = "gitProviderBitbucketApiToken",
}

export type StoredGitLabTokens = Record<
  string,
  {
    access_token: string
    refresh_token: string
    expires_at: number
    account_label?: string
  }
>

export type StoredBitbucketTokens = {
  access_token: string
  refresh_token: string
  expires_at: number
  account_label?: string
}

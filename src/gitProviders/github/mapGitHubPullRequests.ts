import { PullRequestInfo } from "../types"

export type GitHubPullRequestPayload = {
  number: number
  html_url: string
  title: string
  draft?: boolean
  user?: { login?: string }
  head?: { ref?: string }
  base?: { ref?: string }
}

export function mapGitHubPullRequests(pulls: GitHubPullRequestPayload[]): PullRequestInfo[] {
  return pulls.map((pull) => ({
    id: pull.number,
    url: pull.html_url,
    title: pull.title,
    draft: pull.draft,
    authorLabel: pull.user?.login,
    sourceBranch: pull.head?.ref,
    targetBranch: pull.base?.ref,
  }))
}

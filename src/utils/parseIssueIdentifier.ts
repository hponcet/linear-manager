import { PullRequestInfo } from "src/gitProviders/types"

const ISSUE_IDENTIFIER_PATTERN = /\b([A-Za-z][A-Za-z0-9]+)-(\d+)\b/

export function parseIssueIdentifierFromText(text: string): string | undefined {
  const trimmed = text.trim()
  if (!trimmed) {
    return undefined
  }

  const match = trimmed.match(ISSUE_IDENTIFIER_PATTERN)
  if (!match) {
    return undefined
  }

  const [, teamKey, issueNumber] = match
  return `${teamKey.toUpperCase()}-${issueNumber}`
}

export function parseIssueIdentifierFromPullRequest(
  pullRequest: Pick<PullRequestInfo, "title" | "sourceBranch">,
): string | undefined {
  return (
    parseIssueIdentifierFromText(pullRequest.title ?? "") ??
    parseIssueIdentifierFromText(pullRequest.sourceBranch ?? "")
  )
}

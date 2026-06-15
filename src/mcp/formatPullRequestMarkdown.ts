import { PullRequestInfo } from "src/gitProviders/types"
import { parseIssueIdentifierFromPullRequest } from "src/utils/parseIssueIdentifier"

export function formatPullRequestMarkdown(
  pullRequest: PullRequestInfo,
  options?: { linkedIssueIdentifier?: string },
): string {
  const lines = [
    `# Pull request ${pullRequest.id}`,
    "",
    `- **Title:** ${pullRequest.title ?? "Untitled"}`,
    `- **URL:** ${pullRequest.url}`,
  ]

  if (pullRequest.sourceBranch && pullRequest.targetBranch) {
    lines.push(`- **Branches:** ${pullRequest.sourceBranch} → ${pullRequest.targetBranch}`)
  }

  if (pullRequest.authorLabel) {
    lines.push(`- **Author:** ${pullRequest.authorLabel}`)
  }

  if (pullRequest.draft) {
    lines.push("- **Draft:** yes")
  }

  const linkedIssue =
    options?.linkedIssueIdentifier ?? parseIssueIdentifierFromPullRequest(pullRequest)
  if (linkedIssue) {
    lines.push(`- **Linked Linear issue:** ${linkedIssue}`)
  }

  return lines.join("\n")
}

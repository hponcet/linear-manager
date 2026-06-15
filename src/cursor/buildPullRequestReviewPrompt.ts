import { PullRequestInfo } from "src/gitProviders/types"
import { parseIssueIdentifierFromPullRequest } from "src/utils/parseIssueIdentifier"
import { AgentSettingsVscState } from "src/vscStates"

import { DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE } from "./defaultAgentPrompts"
import { renderAgentPromptTemplate } from "./renderAgentPromptTemplate"
import { resolveEditorLanguage } from "./resolveEditorLanguage"

export type PullRequestReviewPromptOptions = {
  editorLanguageLocale?: string
}

function buildPullRequestReviewVariables(
  pullRequest: PullRequestInfo,
  options?: PullRequestReviewPromptOptions,
): Record<string, string> {
  const linkedIssue = parseIssueIdentifierFromPullRequest(pullRequest)
  const title = pullRequest.title?.trim() || `PR #${pullRequest.id}`

  const linkedIssueInstructions = linkedIssue
    ? [
        `- \`get_issue\`, \`get_related_issues\`, and \`get_issue_comments\` for linked issue ${linkedIssue} (source of truth for expected behavior and discussion)`,
      ].join("\n")
    : ""

  const pullRequestDiffInstructions =
    pullRequest.sourceBranch && pullRequest.targetBranch
      ? `- \`get_pull_request_diff\` with sourceBranch ${JSON.stringify(pullRequest.sourceBranch)} and targetBranch ${JSON.stringify(pullRequest.targetBranch)}`
      : `- \`get_pull_request_diff\` with pullRequestId ${JSON.stringify(String(pullRequest.id))}`

  const linkedIssueFixInstructions = linkedIssue
    ? [
        "",
        "Step 3 — If the PR does not fully satisfy the ticket, implement the missing changes in this workspace immediately (do not stop at review only).",
      ].join("\n")
    : ""

  return {
    pullRequestId: String(pullRequest.id),
    pullRequestTitle: title,
    sourceBranch: pullRequest.sourceBranch ?? "",
    targetBranch: pullRequest.targetBranch ?? "",
    linkedIssueIdentifier: linkedIssue ?? "",
    linkedIssueInstructions,
    pullRequestDiffInstructions,
    linkedIssueFixInstructions,
    editorLanguage: resolveEditorLanguage(options?.editorLanguageLocale),
  }
}

export function buildPullRequestReviewPrompt(
  pullRequest: PullRequestInfo,
  settings?: Pick<AgentSettingsVscState, "pullRequestReviewPromptTemplate">,
  options?: PullRequestReviewPromptOptions,
): string {
  const template =
    settings?.pullRequestReviewPromptTemplate?.trim() || DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE

  return renderAgentPromptTemplate(template, buildPullRequestReviewVariables(pullRequest, options))
}

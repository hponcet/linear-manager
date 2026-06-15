import { SerializedIssue } from "src/types/SerializedLinear"
import { useGitProvider } from "src/webviews/hooks/useGitProvider"
import { useIssueSettings } from "src/webviews/hooks/useIssueSettings"
import { usePullRequest } from "src/webviews/hooks/usePullRequest"

import { Button, ButtonProps } from "../Button/Button"
import { GitPullRequestIcon } from "../Icons/GitPullRequestIcon"

export type PullRequestButtonProps = Omit<ButtonProps, "size"> & {
  issue: SerializedIssue
  branchName?: string
  size?: number
  inline?: "icon"
}

export function PullRequestButton(props: PullRequestButtonProps) {
  const { issue, branchName, className, style, size = 14, inline, onClick, ...buttonProps } = props

  const { issueSettings } = useIssueSettings({ issueId: issue.id })
  const { status: providerStatus } = useGitProvider()

  const sourceBranch = branchName ?? issueSettings.branch?.name
  const branchReady = Boolean(issueSettings.branchInitialized && sourceBranch)
  const providerReady = Boolean(
    providerStatus?.provider &&
    providerStatus.connected &&
    providerStatus.remoteMatchesProvider !== false,
  )
  const visible = branchReady && providerReady

  const {
    status: pullRequestStatus,
    loading,
    openPullRequest,
  } = usePullRequest({
    sourceBranch,
    enabled: visible,
  })

  if (!visible) {
    return null
  }

  const label = pullRequestStatus?.exists ? "View pull request" : "Create pull request"

  async function handleClick() {
    await onClick?.()
    if (!sourceBranch) return
    await openPullRequest(issue.id, sourceBranch)
  }

  return (
    <Button
      style={style}
      className={className}
      onClick={handleClick}
      disabled={loading}
      tooltip={label}
      icon={
        <GitPullRequestIcon
          size={size}
          variant={pullRequestStatus?.exists ? "view" : "create"}
          style={{ marginRight: inline === "icon" ? 0 : 8 }}
        />
      }
      {...buttonProps}
    >
      {inline === "icon" ? null : label}
    </Button>
  )
}

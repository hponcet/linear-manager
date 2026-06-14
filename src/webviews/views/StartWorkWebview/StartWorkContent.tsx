import { useEffect, useMemo, useState } from "react"
import { Ref } from "src/types/GitAPI"
import { IssueVscState } from "src/vscStates"
import { useIssueContext } from "src/webviews/contexts/IssueContext"
import { useIssueBranches } from "src/webviews/hooks/useGitBranches"
import { useSettings } from "src/webviews/hooks/useSettings"
import { checkPossiblyExistingBranchName, getDefaultBranchName } from "src/webviews/utils/branches"

import { StartWorkBanner } from "./StartWorkBanner"
import { StartWorkBranchCreation } from "./StartWorkBranchCreation"
import { StartWorkHeader } from "./StartWorkHeader"

export type StartWorkContentProps = {
  branches?: Ref[]
  currentBranch?: Ref | null
  fromCheckout: boolean
  repoInitialized: boolean
  gitInitialized: boolean
  issueSettings: IssueVscState[string]
  updateIssueSettings: (value: Partial<IssueVscState[string]>) => void
}

export function StartWorkContent(props: StartWorkContentProps) {
  const {
    branches,
    currentBranch,
    fromCheckout,
    repoInitialized,
    gitInitialized,
    issueSettings,
    updateIssueSettings,
  } = props

  const { issue, issueLabelsLoading } = useIssueContext()
  const { hasUncommittedChanges } = useIssueBranches({ issueId: issue.id })
  const { branchesSettings, branchesSettingsAreLoading } = useSettings()

  const [stashChanges, setStashChanges] = useState(!!branchesSettings.stashBeforeCreate)

  useEffect(() => {
    if (!branchesSettingsAreLoading) {
      setStashChanges(!!branchesSettings.stashBeforeCreate)
    }
  }, [branchesSettings.stashBeforeCreate, branchesSettingsAreLoading])

  const initialBranchName = useMemo(
    () =>
      issueSettings.branch?.name ||
      getDefaultBranchName(issue, branchesSettings, issue.labelIds ?? []),
    [issue, branchesSettings, issueSettings.branch?.name],
  )

  const { matchingBranches, existingBranch } = useMemo(() => {
    const [matchingBranches, existingBranch] = checkPossiblyExistingBranchName(
      issueSettings.branch?.name || initialBranchName || "",
      issue.identifier,
      branches?.filter((b) => !issueSettings.ignoredBranches?.includes(b.name || "")) || [],
    )

    return { matchingBranches, existingBranch }
  }, [
    branches,
    issue.identifier,
    issueSettings.branch?.name,
    issueSettings.ignoredBranches,
    initialBranchName,
  ])

  if (branchesSettingsAreLoading || issueLabelsLoading) {
    return null
  }

  return (
    <div>
      <StartWorkHeader />
      <h5>
        {fromCheckout ? "Create branch for issue" : "Start work on issue"} {issue.identifier}
      </h5>

      <StartWorkBanner
        issue={issue}
        repoInitialized={repoInitialized}
        gitInitialized={gitInitialized}
        fromCheckout={fromCheckout}
        hasUncommittedChanges={hasUncommittedChanges}
        matchingBranches={matchingBranches}
        existingBranch={existingBranch}
        issueSettings={issueSettings}
        stashChanges={stashChanges}
        setStashChanges={setStashChanges}
        updateIssueSettings={updateIssueSettings}
      >
        <StartWorkBranchCreation
          issue={issue}
          branches={branches}
          currentBranch={currentBranch}
          issueSettings={issueSettings}
          updateIssueSettings={updateIssueSettings}
          initialBranchName={initialBranchName}
          stashChanges={stashChanges}
        />
      </StartWorkBanner>
    </div>
  )
}

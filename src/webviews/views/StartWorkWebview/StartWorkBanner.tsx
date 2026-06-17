import { useMemo, useState } from "react"
import { Ref } from "src/types/GitAPI"
import { SerializedIssue } from "src/types/SerializedLinear"
import { IssueVscState } from "src/vscStates"
import { Banner } from "src/webviews/components/Banner/Banner"
import { Branch } from "src/webviews/components/BranchPicker/Branch"
import { Button } from "src/webviews/components/Button/Button"

type StartWorkBannerProps = {
  issue: SerializedIssue
  repoInitialized: boolean
  gitInitialized: boolean
  fromCheckout: boolean
  stashChanges: boolean
  setStashChanges: (v: boolean) => void
  existingBranch?: Ref | null
  hasUncommittedChanges: boolean
  matchingBranches?: Ref[]
  issueSettings: IssueVscState[SerializedIssue["id"]]
  updateIssueSettings: (value: Partial<IssueVscState[SerializedIssue["id"]]>) => void
  children: React.ReactNode
}

export function StartWorkBanner(props: StartWorkBannerProps) {
  const {
    issue,
    repoInitialized,
    gitInitialized,
    stashChanges,
    fromCheckout,
    existingBranch,
    hasUncommittedChanges,
    matchingBranches = [],
    children,
    issueSettings,
    updateIssueSettings,
    setStashChanges,
  } = props

  const [askUseBranchAsDefault, setAskUseBranchAsDefault] = useState(!!existingBranch)

  const filteredMatchingBranches = useMemo(
    () =>
      matchingBranches.filter((b) => {
        const ignoredBranches = issueSettings?.ignoredBranches || []
        return !ignoredBranches.includes(b.name || "")
      }),
    [matchingBranches, issueSettings],
  )

  function setBranchAsUsed(branch: Ref) {
    updateIssueSettings({
      branch,
      branchInitialized: true,
    })
  }

  function setBranchAsUnused(branch: Ref | Ref[]) {
    updateIssueSettings({
      ignoredBranches: Array.isArray(branch)
        ? [
            ...(issueSettings?.ignoredBranches || []),
            ...branch.map((b) => b.name).filter((name): name is string => !!name),
          ]
        : issueSettings?.ignoredBranches
          ? branch.name
            ? [...(issueSettings?.ignoredBranches || []), branch.name]
            : issueSettings?.ignoredBranches
          : undefined,
    })
  }

  if (issueSettings.branchInitialized && issueSettings.branch) {
    return children
  }

  if (!gitInitialized) {
    return (
      <div className="startWorkBannerError">
        <Banner type="error">
          Git is not initialized in this workspace. Please initialize Git to enable branch
          management features.
        </Banner>
      </div>
    )
  }

  if (!repoInitialized) {
    return (
      <div className="startWorkBannerError">
        <Banner type="error">
          No Git repository found in this workspace. Please initialize a Git repository to enable
          branch management features.
        </Banner>
      </div>
    )
  }

  if (askUseBranchAsDefault && existingBranch) {
    return (
      <div className="startWorkBannerError">
        <Banner type="info" style={{ marginBottom: 30 }}>
          A branch named{" "}
          <b>
            <Branch branch={existingBranch} inline="text" />
          </b>{" "}
          already exists for the issue {issue.identifier}. Would you like to use this branch as the
          default branch for this issue?
          <div className="startWorkBannerActions">
            <Button
              variant="default"
              onClick={() => {
                setAskUseBranchAsDefault(false)
                setBranchAsUnused(existingBranch)
              }}
            >
              No, create a new branch
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAskUseBranchAsDefault(false)
                setBranchAsUsed(existingBranch)
              }}
            >
              Yes, use existing branch
            </Button>
          </div>
        </Banner>
      </div>
    )
  }

  if (hasUncommittedChanges && !stashChanges) {
    return (
      <div className="startWorkBannerError">
        <Banner type="warning" style={{ marginBottom: 30 }}>
          <div>
            You have uncommitted changes in your working directory. Stash them before changing
            branches, then reapply them after the branch changes.
          </div>
          <div className="startWorkBannerActions">
            <Button variant="primary" onClick={() => setStashChanges(true)}>
              Stash changes and continue
            </Button>
          </div>
        </Banner>
      </div>
    )
  }

  return (
    <>
      <div className="startWorkBannerContainer">
        {fromCheckout && (
          <Banner type="info" style={{ marginBottom: 30 }}>
            No branch found the issue {issue.identifier}. Please configure the branch settings below
            to start working on this issue.
          </Banner>
        )}

        {!hasUncommittedChanges && filteredMatchingBranches.length > 0 && (
          <Banner type="warning" style={{ marginBottom: 30 }}>
            <p>We have detected several branches that are likely to originate from this issue:</p>
            <ul>
              {filteredMatchingBranches.map((branch) => (
                <div key={branch.name} className="startWorkBannerBranchRow">
                  <Branch branch={branch} />
                  <Button
                    variant="primary"
                    onClick={() => {
                      setAskUseBranchAsDefault(false)
                      setBranchAsUsed(branch)
                    }}
                  >
                    Use this branch
                  </Button>
                </div>
              ))}
            </ul>
            <div className="startWorkBannerActions">
              <Button
                variant="default"
                onClick={() => {
                  setAskUseBranchAsDefault(false)
                  setBranchAsUnused(filteredMatchingBranches)
                }}
              >
                Ignore
              </Button>
            </div>
          </Banner>
        )}
      </div>
      {children}
    </>
  )
}

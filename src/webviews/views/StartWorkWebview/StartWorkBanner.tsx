import { Issue } from "@linear/sdk"
import { useMemo, useState } from "react"
import { Ref } from "src/types/GitAPI"
import { IssueVscState } from "src/vscStates"
import { Banner } from "src/webviews/components/Banner/Banner"
import { Branch } from "src/webviews/components/BranchPicker/Branch"
import { Button } from "src/webviews/components/Button/Button"

type StartWorkBannerProps = {
  issue: Issue
  repoInitialized: boolean
  gitInitialized: boolean
  fromCheckout: boolean
  existingBranch?: Ref | null
  hasUncommittedChanges: boolean
  matchingBranches?: Ref[]
  issueSettings: IssueVscState[Issue["id"]]
  updateIssueSettings: (value: Partial<IssueVscState[Issue["id"]]>) => void
  children: React.ReactNode
}

export function StartWorkBanner(props: StartWorkBannerProps) {
  const {
    issue,
    repoInitialized,
    gitInitialized,
    fromCheckout,
    existingBranch,
    hasUncommittedChanges,
    matchingBranches = [],
    children,
    issueSettings,
    updateIssueSettings,
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
          <div style={{ marginTop: 15, marginLeft: "auto", display: "table" }}>
            <Button
              color="var(--banner-info-text)"
              style={{
                padding: "0 6px",
                fontWeight: "bolder",
              }}
              onClick={() => {
                setAskUseBranchAsDefault(false)
                setBranchAsUnused(existingBranch)
              }}
            >
              No, create a new branch
            </Button>
            <Button
              color="var(--banner-info-text)"
              style={{
                padding: "0 6px",
                fontWeight: "bolder",
              }}
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

  if (hasUncommittedChanges) {
    return (
      <div className="startWorkBannerError">
        <Banner type="warning" style={{ marginBottom: 30 }}>
          You have uncommitted changes in your working directory. Please commit or stash your
          changes before starting work on this issue.
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
                <div
                  key={branch.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Branch key={branch.name} branch={branch} />
                  <div style={{ marginLeft: "auto", display: "flex" }}>
                    <Button
                      onClick={() => {
                        setAskUseBranchAsDefault(false)
                        setBranchAsUsed(branch)
                      }}
                      style={{ padding: "0 6px" }}
                    >
                      Use this branch
                    </Button>
                  </div>
                </div>
              ))}
            </ul>
            <Button
              onClick={() => {
                setAskUseBranchAsDefault(false)
                setBranchAsUnused(filteredMatchingBranches)
              }}
              style={{ padding: "0 6px", display: "table", marginLeft: "auto" }}
            >
              Ignore
            </Button>
          </Banner>
        )}
      </div>
      {children}
    </>
  )
}

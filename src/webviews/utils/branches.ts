import { Issue } from "@linear/sdk"
import { Ref } from "src/types/GitAPI"
import { SettingsVscState } from "src/vscStates"

const issueKeyRegex = (projectKey: string, issueNumber: string) =>
  new RegExp(`(${projectKey}|${projectKey.toUpperCase()})(-|_|)${issueNumber}`)

const issueNumberRegex = (projectKey: string) =>
  new RegExp(`(${projectKey}|${projectKey.toUpperCase()})(-|_|)([0-9].+)$`)

function getBranchNameTitle(branchName: string, projectKey: string): string | null {
  const checkIssueTitle = new RegExp(
    `^(.+)(${projectKey}|${projectKey.toUpperCase()})(-|_|)([0-9]+)(-|_|)`,
  )

  if (!branchName.match(issueNumberRegex(projectKey))) {
    return null
  }

  return branchName.replace(checkIssueTitle, "").replace(/[-_]/g, " ").trim().toLowerCase()
}

export function checkPossiblyExistingBranchName(
  branchName: string,
  issueIdentifier: Issue["identifier"],
  branches: Ref[] = [],
): [Ref[], Ref | undefined] {
  const [projectKey, issueNumber] = issueIdentifier.toLowerCase().split("-")

  const checkIssueKey = issueKeyRegex(projectKey, issueNumber)
  const checkIssueNumber = issueNumberRegex(projectKey)

  let existingBranch: Ref | undefined

  const matchingBranches =
    branches
      .filter((b) => {
        if (
          b.name?.toLowerCase() === branchName?.toLowerCase() ||
          b.name?.toLowerCase().replace("origin/", "") === branchName?.toLowerCase()
        ) {
          existingBranch = b
          return true
        }

        if (b.name?.match(checkIssueKey)) {
          return true
        }

        const matches = b.name?.match(checkIssueNumber) || []
        const branchIssueNumber = matches[3]

        if (branchIssueNumber === issueNumber) {
          return true
        }

        const branchTitle = getBranchNameTitle(b.name || "", projectKey)
        const issueBranchTitle = getBranchNameTitle(branchName, projectKey)

        if (
          branchTitle &&
          issueBranchTitle &&
          (branchTitle.includes(issueBranchTitle) || issueBranchTitle.includes(branchTitle))
        ) {
          return true
        }

        return false
      })
      .sort((a, b) => a.name!.localeCompare(b.name!)) || []

  return [matchingBranches, existingBranch]
}

export function validateBranchName(branchName?: string, branches: Ref[] = []): Promise<void> {
  if (!branchName) {
    throw new Error("Branch name is required")
  }

  if (branchName.includes(" ")) {
    throw new Error("Branch name cannot contain spaces")
  }
  if (branches.some((b) => b.name === branchName)) {
    throw new Error("Branch name already exists")
  }
  return Promise.resolve()
}

export function getDefaultBranchName(
  issue: Issue,
  branchesSettings: SettingsVscState,
  labelIds: string[],
): string {
  let prefix = issue.branchName.split("/")[0]

  if (branchesSettings.prefixByLabel && branchesSettings.prefixByLabelList?.length) {
    const prefixByLabelList = branchesSettings.prefixByLabelList || []
    const label = prefixByLabelList.find((l) => labelIds.includes(l.label.id))
    if (label) {
      prefix = label.prefix
    } else if (prefixByLabelList[0]?.prefix) {
      prefix = prefixByLabelList[0].prefix
    }
  }

  const sanitizedTitle = issue.branchName.split("/")[1]
  let title = `${prefix}/${sanitizedTitle}`

  if (branchesSettings.uppercaseIssueIdentifier) {
    const [projectKey, issueNumber] = issue.identifier.split("-")
    const issueNumberRegex = new RegExp(
      `(${projectKey.toLowerCase()}|${projectKey.toUpperCase()})(-|_|)${issueNumber}`,
    )
    title = title.replace(issueNumberRegex, `${projectKey.toUpperCase()}-${issueNumber}`)
  }

  return title
}

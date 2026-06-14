import { QuickPickItem, window } from "vscode"

import { Ref } from "../types/GitAPI"

export type PickTargetBranchParams = {
  sourceBranch: string
  branches: Ref[]
  defaultBranch?: string
}

export type QuickPickFn = <T extends QuickPickItem>(
  items: readonly T[] | Thenable<readonly T[]>,
  options?: Parameters<typeof window.showQuickPick>[1],
) => Thenable<T | undefined>

export async function pickTargetBranch(
  params: PickTargetBranchParams,
  showQuickPick: QuickPickFn = window.showQuickPick.bind(window),
): Promise<string | undefined> {
  const branchNames = params.branches
    .map((branch) => branch.name)
    .filter((name): name is string => Boolean(name))
    .filter((name) => name !== params.sourceBranch)

  const uniqueNames = [...new Set(branchNames)].sort((left, right) => {
    if (params.defaultBranch) {
      if (left === params.defaultBranch) return -1
      if (right === params.defaultBranch) return 1
    }
    return left.localeCompare(right)
  })

  if (uniqueNames.length === 0) {
    window.showWarningMessage("No target branches available for pull request.")
    return undefined
  }

  const items: QuickPickItem[] = uniqueNames.map((label) => ({ label }))

  const picked = await showQuickPick(items, {
    title: "Select target branch",
    placeHolder: "Branch to merge into (e.g. main)",
    matchOnDescription: true,
  })

  return picked?.label
}

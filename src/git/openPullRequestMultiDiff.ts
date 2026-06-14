import { basename } from "path"

import { commands, Uri, window } from "vscode"

import { Change, GitAPI, Repository, Status } from "../types/GitAPI"

export type MultiDiffResource = {
  originalUri: Uri
  modifiedUri: Uri
}

const MAX_FALLBACK_DIFFS = 25

export function buildMultiDiffResources(
  api: GitAPI,
  changes: Change[],
  baseRef: string,
  headRef: string,
): MultiDiffResource[] {
  return changes.map((change) => {
    const modifiedPath = change.renameUri ?? change.uri
    const originalPath = change.originalUri

    if (
      change.status === Status.DELETED ||
      change.status === Status.INDEX_DELETED ||
      change.status === Status.DELETED_BY_US
    ) {
      return {
        originalUri: api.toGitUri(originalPath, baseRef),
        modifiedUri: api.toGitUri(originalPath, headRef),
      }
    }

    return {
      originalUri: api.toGitUri(originalPath, baseRef),
      modifiedUri: api.toGitUri(modifiedPath, headRef),
    }
  })
}

async function resolveBranchRef(repository: Repository, branchName: string): Promise<string> {
  const candidates = [branchName, `origin/${branchName}`]

  for (const candidate of candidates) {
    try {
      await repository.getBranch(candidate)
      return candidate
    } catch {
      // Try the next ref candidate.
    }
  }

  throw new Error(
    `Branch "${branchName}" was not found locally or on origin. Fetch the remote and try again.`,
  )
}

async function tryOpenMultiDiffEditor(
  title: string,
  resources: MultiDiffResource[],
): Promise<boolean> {
  try {
    await commands.executeCommand("_workbench.openMultiDiffEditor", {
      title,
      resources,
    })
    return true
  } catch {
    return false
  }
}

async function openDiffTabsFallback(title: string, resources: MultiDiffResource[]): Promise<void> {
  const filesToOpen = resources.slice(0, MAX_FALLBACK_DIFFS)

  for (const [index, resource] of filesToOpen.entries()) {
    const filePath = resource.modifiedUri.path || resource.originalUri.path
    const fileName = basename(filePath)
    const diffTitle = `${fileName} (${index + 1}/${filesToOpen.length}) — ${title}`

    await commands.executeCommand(
      "vscode.diff",
      resource.originalUri,
      resource.modifiedUri,
      diffTitle,
      { preview: index > 0 },
    )
  }

  if (resources.length > MAX_FALLBACK_DIFFS) {
    void window.showInformationMessage(
      `Opened ${MAX_FALLBACK_DIFFS} of ${resources.length} changed files. The remaining files were skipped.`,
    )
  }
}

export async function openPullRequestMultiDiff(options: {
  repository: Repository
  api: GitAPI
  sourceBranch: string
  targetBranch: string
  title?: string
}): Promise<void> {
  const { repository, api, sourceBranch, targetBranch } = options

  await repository.fetch({ all: true, prune: true })

  const headRef = await resolveBranchRef(repository, sourceBranch)
  const baseRef = await resolveBranchRef(repository, targetBranch)
  const mergeBase = await repository.getMergeBase(baseRef, headRef)
  const changes = await repository.diffBetween(mergeBase, headRef)

  if (changes.length === 0) {
    throw new Error("No changes found for this pull request.")
  }

  const resources = buildMultiDiffResources(api, changes, mergeBase, headRef)
  const title =
    options.title?.trim() ||
    `Pull request: ${sourceBranch} → ${targetBranch} (${changes.length} files)`

  const openedMultiDiff = await tryOpenMultiDiffEditor(title, resources)
  if (openedMultiDiff) {
    return
  }

  await openDiffTabsFallback(title, resources)
}

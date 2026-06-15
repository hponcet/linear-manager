import { execFile } from "child_process"
import { promisify } from "util"

import { Change, Repository } from "src/types/GitAPI"

import { MAX_DIFF_BYTES, truncateRawDiff } from "../mcp/gitMcpApi"

const execFileAsync = promisify(execFile)

function getChangePath(change: Change): string {
  return change.renameUri?.path || change.uri.path
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

export async function collectPullRequestPatch(options: {
  repository: Repository
  sourceBranch: string
  targetBranch: string
}): Promise<string> {
  const { repository, sourceBranch, targetBranch } = options

  await repository.fetch({ all: true, prune: true })

  const headRef = await resolveBranchRef(repository, sourceBranch)
  const baseRef = await resolveBranchRef(repository, targetBranch)
  const mergeBase = await repository.getMergeBase(baseRef, headRef)
  const changes = await repository.diffBetween(mergeBase, headRef)

  if (changes.length === 0) {
    throw new Error("No changes found for this pull request.")
  }

  const patches: string[] = []
  let totalBytes = 0

  for (const change of changes) {
    const path = getChangePath(change)
    const patch = await repository.diffBetween(mergeBase, headRef, path)
    const header = `# ${path}\n`
    const nextBytes = totalBytes + header.length + patch.length
    if (nextBytes > MAX_DIFF_BYTES) {
      const remaining = MAX_DIFF_BYTES - totalBytes - header.length
      if (remaining > 0) {
        patches.push(`${header}${patch.slice(0, remaining)}\n\n… truncated`)
      }
      break
    }

    patches.push(`${header}${patch}`)
    totalBytes = nextBytes
  }

  if (patches.length === 0) {
    return "_No diff content available._"
  }

  return patches.join("\n\n")
}

async function resolveGitBranchRef(workspaceFolder: string, branchName: string): Promise<string> {
  for (const candidate of [branchName, `origin/${branchName}`]) {
    try {
      await execFileAsync("git", ["rev-parse", "--verify", candidate], { cwd: workspaceFolder })
      return candidate
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(`Branch "${branchName}" was not found locally or on origin.`)
}

export async function collectPullRequestPatchFromWorkspace(
  workspaceFolder: string,
  sourceBranch: string,
  targetBranch: string,
): Promise<string> {
  await execFileAsync("git", ["fetch", "--all", "--prune"], { cwd: workspaceFolder })

  const headRef = await resolveGitBranchRef(workspaceFolder, sourceBranch)
  const baseRef = await resolveGitBranchRef(workspaceFolder, targetBranch)
  const { stdout: mergeBase } = await execFileAsync("git", ["merge-base", baseRef, headRef], {
    cwd: workspaceFolder,
  })

  const { stdout: diff } = await execFileAsync("git", ["diff", mergeBase.trim(), headRef], {
    cwd: workspaceFolder,
    maxBuffer: MAX_DIFF_BYTES * 2,
  })

  return truncateRawDiff(diff)
}

export { buildMultiDiffResources } from "./openPullRequestMultiDiff"

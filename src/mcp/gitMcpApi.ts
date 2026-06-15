import { execFile } from "child_process"
import { promisify } from "util"

import {
  GitHubPullRequestPayload,
  mapGitHubPullRequests,
} from "src/gitProviders/github/mapGitHubPullRequests"
import { GitProviderId, ParsedRemote, PullRequestInfo } from "src/gitProviders/types"
import { parseIssueIdentifierFromPullRequest } from "src/utils/parseIssueIdentifier"

import { formatPullRequestMarkdown } from "./formatPullRequestMarkdown"

const execFileAsync = promisify(execFile)

export const MAX_DIFF_FILES = 50
export const MAX_DIFF_BYTES = 500_000

export type GitMcpEnv = {
  provider?: GitProviderId
  owner?: string
  repo?: string
  host?: string
  accessToken?: string
  authHeader?: string
  workspaceFolder?: string
}

type DiffFile = {
  path: string
  patch: string
  status?: string
}

export function truncateRawDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_BYTES) {
    return diff
  }

  return `${diff.slice(0, MAX_DIFF_BYTES)}\n\n… truncated (${diff.length - MAX_DIFF_BYTES} bytes omitted)`
}

export function truncateDiffFiles(files: DiffFile[]): string {
  const included: string[] = []
  let totalBytes = 0
  let omitted = 0

  for (const file of files.slice(0, MAX_DIFF_FILES)) {
    const header = `# ${file.path}${file.status ? ` (${file.status})` : ""}\n`
    let patch = file.patch || "_Binary or empty change._"

    const nextBytes = totalBytes + header.length + patch.length
    if (nextBytes > MAX_DIFF_BYTES) {
      const remaining = MAX_DIFF_BYTES - totalBytes - header.length
      if (remaining > 0) {
        patch = `${patch.slice(0, remaining)}\n\n… truncated`
        included.push(`${header}${patch}`)
      }
      omitted += files.length - included.length
      break
    }

    included.push(`${header}${patch}`)
    totalBytes = nextBytes
  }

  if (files.length > MAX_DIFF_FILES) {
    omitted += files.length - MAX_DIFF_FILES
  }

  if (included.length === 0) {
    return "_No diff content available._"
  }

  const footer =
    omitted > 0 ? `\n\n_${omitted} additional file(s) omitted due to size limits._` : ""
  return included.join("\n\n") + footer
}

export function readGitMcpEnv(): GitMcpEnv {
  return {
    provider: process.env.GIT_PROVIDER as GitProviderId | undefined,
    owner: process.env.GIT_REMOTE_OWNER,
    repo: process.env.GIT_REMOTE_REPO,
    host: process.env.GIT_REMOTE_HOST,
    accessToken: process.env.GIT_ACCESS_TOKEN,
    authHeader: process.env.GIT_AUTH_HEADER,
    workspaceFolder: process.env.WORKSPACE_FOLDER,
  }
}

export function hasConfiguredGitRemote(env: GitMcpEnv): boolean {
  return !!(env.provider && env.owner && env.repo)
}

export function canUseLocalGitDiff(
  env: GitMcpEnv,
  sourceBranch?: string,
  targetBranch?: string,
): boolean {
  return !!(env.workspaceFolder && sourceBranch && targetBranch)
}

export function requireGitRemote(env: GitMcpEnv): ParsedRemote {
  if (!hasConfiguredGitRemote(env)) {
    throw new Error(
      "Git remote is not configured. Open a workspace with a git repository and connect a git provider in Linear Manager, or pass sourceBranch and targetBranch to fetch a local git diff.",
    )
  }

  return {
    provider: env.provider!,
    owner: env.owner!,
    repo: env.repo!,
    host: env.host,
  }
}

function buildAuthHeaders(env: GitMcpEnv): HeadersInit {
  if (env.authHeader) {
    return { Authorization: env.authHeader }
  }

  if (env.accessToken) {
    return { Authorization: `Bearer ${env.accessToken}` }
  }

  throw new Error("Git provider is not connected. Connect your git provider in Linear Manager.")
}

async function resolveBranchRef(workspaceFolder: string, branchName: string): Promise<string> {
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

async function listGitHubPullRequests(
  remote: ParsedRemote,
  headers: HeadersInit,
): Promise<PullRequestInfo[]> {
  const url = `https://api.github.com/repos/${remote.owner}/${remote.repo}/pulls?state=open&per_page=100`
  const response = await fetch(url, {
    headers: {
      ...headers,
      Accept: "application/vnd.github+json",
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: HTTP ${response.status}`)
  }

  const pulls = (await response.json()) as GitHubPullRequestPayload[]
  return mapGitHubPullRequests(pulls).sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
}

async function listGitLabPullRequests(
  remote: ParsedRemote,
  headers: HeadersInit,
): Promise<PullRequestInfo[]> {
  const instanceUrl = (remote.host ?? "https://gitlab.com").replace(/\/$/, "")
  const projectPath = encodeURIComponent(`${remote.owner}/${remote.repo}`)
  const url = `${instanceUrl}/api/v4/projects/${projectPath}/merge_requests?state=opened&per_page=50`

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`GitLab API error: HTTP ${response.status}`)
  }

  const mergeRequests = (await response.json()) as Array<{
    iid: number
    web_url: string
    title: string
    source_branch?: string
    target_branch?: string
    author?: { username?: string; name?: string }
    draft?: boolean
  }>

  return mergeRequests
    .map((mr) => ({
      id: mr.iid,
      url: mr.web_url,
      title: mr.title,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      authorLabel: mr.author?.username || mr.author?.name,
      draft: mr.draft,
    }))
    .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
}

async function listBitbucketPullRequests(
  remote: ParsedRemote,
  headers: HeadersInit,
): Promise<PullRequestInfo[]> {
  const url = `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests?q=${encodeURIComponent('state="OPEN"')}&pagelen=50`
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`Bitbucket API error: HTTP ${response.status}`)
  }

  const data = (await response.json()) as {
    values?: Array<{
      id: number
      title: string
      links: { html: { href: string } }
      source?: { branch?: { name?: string } }
      destination?: { branch?: { name?: string } }
      author?: { display_name?: string; nickname?: string }
    }>
  }

  return (data.values ?? [])
    .map((pr) => ({
      id: pr.id,
      url: pr.links.html.href,
      title: pr.title,
      sourceBranch: pr.source?.branch?.name,
      targetBranch: pr.destination?.branch?.name,
      authorLabel: pr.author?.display_name || pr.author?.nickname,
    }))
    .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
}

async function getGitHubCompareDiff(
  remote: ParsedRemote,
  headers: HeadersInit,
  sourceBranch: string,
  targetBranch: string,
): Promise<string> {
  const compareRef = `${encodeURIComponent(targetBranch)}...${encodeURIComponent(sourceBranch)}`
  const url = `https://api.github.com/repos/${remote.owner}/${remote.repo}/compare/${compareRef}`
  const response = await fetch(url, {
    headers: {
      ...headers,
      Accept: "application/vnd.github+json",
    },
    signal: AbortSignal.timeout(60000),
  })

  if (!response.ok) {
    throw new Error(`GitHub compare API error: HTTP ${response.status}`)
  }

  const data = (await response.json()) as {
    files?: Array<{ filename?: string; patch?: string; status?: string }>
  }

  return truncateDiffFiles(
    (data.files ?? []).map((file) => ({
      path: file.filename ?? "unknown",
      patch: file.patch ?? "",
      status: file.status,
    })),
  )
}

async function getGitLabMergeRequestDiff(
  remote: ParsedRemote,
  headers: HeadersInit,
  sourceBranch: string,
  targetBranch: string,
): Promise<string> {
  const instanceUrl = (remote.host ?? "https://gitlab.com").replace(/\/$/, "")
  const projectPath = encodeURIComponent(`${remote.owner}/${remote.repo}`)
  const listUrl = `${instanceUrl}/api/v4/projects/${projectPath}/merge_requests?state=opened&source_branch=${encodeURIComponent(sourceBranch)}&target_branch=${encodeURIComponent(targetBranch)}`

  const listResponse = await fetch(listUrl, {
    headers,
    signal: AbortSignal.timeout(30000),
  })

  if (!listResponse.ok) {
    throw new Error(`GitLab API error: HTTP ${listResponse.status}`)
  }

  const mergeRequests = (await listResponse.json()) as Array<{ iid: number }>
  const mergeRequest = mergeRequests[0]
  if (!mergeRequest) {
    throw new Error("GitLab merge request was not found for the requested branches.")
  }

  const changesUrl = `${instanceUrl}/api/v4/projects/${projectPath}/merge_requests/${mergeRequest.iid}/changes`
  const changesResponse = await fetch(changesUrl, {
    headers,
    signal: AbortSignal.timeout(60000),
  })

  if (!changesResponse.ok) {
    throw new Error(`GitLab changes API error: HTTP ${changesResponse.status}`)
  }

  const changes = (await changesResponse.json()) as {
    changes?: Array<{ new_path?: string; diff?: string }>
  }

  return truncateDiffFiles(
    (changes.changes ?? []).map((change) => ({
      path: change.new_path ?? "unknown",
      patch: change.diff ?? "",
    })),
  )
}

async function getBitbucketPullRequestDiff(
  remote: ParsedRemote,
  headers: HeadersInit,
  sourceBranch: string,
): Promise<string> {
  const listUrl = `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests?q=${encodeURIComponent(`source.branch.name="${sourceBranch}" AND state="OPEN"`)}`
  const listResponse = await fetch(listUrl, {
    headers,
    signal: AbortSignal.timeout(30000),
  })

  if (!listResponse.ok) {
    throw new Error(`Bitbucket API error: HTTP ${listResponse.status}`)
  }

  const data = (await listResponse.json()) as { values?: Array<{ id: number }> }
  const pullRequest = data.values?.[0]
  if (!pullRequest) {
    throw new Error("Bitbucket pull request was not found for the requested source branch.")
  }

  const diffUrl = `https://api.bitbucket.org/2.0/repositories/${remote.owner}/${remote.repo}/pullrequests/${pullRequest.id}/diff`
  const diffResponse = await fetch(diffUrl, {
    headers: {
      ...headers,
      Accept: "text/plain",
    },
    signal: AbortSignal.timeout(60000),
  })

  if (!diffResponse.ok) {
    throw new Error(`Bitbucket diff API error: HTTP ${diffResponse.status}`)
  }

  const diff = await diffResponse.text()
  return truncateRawDiff(diff)
}

async function getProviderPullRequestDiff(
  env: GitMcpEnv,
  sourceBranch: string,
  targetBranch: string,
): Promise<string> {
  const remote = requireGitRemote(env)
  const headers = buildAuthHeaders(env)

  switch (remote.provider) {
    case "github":
      return getGitHubCompareDiff(remote, headers, sourceBranch, targetBranch)
    case "gitlab":
      return getGitLabMergeRequestDiff(remote, headers, sourceBranch, targetBranch)
    case "bitbucket":
      return getBitbucketPullRequestDiff(remote, headers, sourceBranch)
    default:
      throw new Error(`Unsupported git provider: ${remote.provider}`)
  }
}

async function getLocalGitPullRequestDiff(
  workspaceFolder: string,
  sourceBranch: string,
  targetBranch: string,
): Promise<string> {
  await execFileAsync("git", ["fetch", "--all", "--prune"], { cwd: workspaceFolder })

  const headRef = await resolveBranchRef(workspaceFolder, sourceBranch)
  const baseRef = await resolveBranchRef(workspaceFolder, targetBranch)
  const { stdout: mergeBase } = await execFileAsync("git", ["merge-base", baseRef, headRef], {
    cwd: workspaceFolder,
  })

  const { stdout: diff } = await execFileAsync("git", ["diff", mergeBase.trim(), headRef], {
    cwd: workspaceFolder,
    maxBuffer: MAX_DIFF_BYTES * 2,
  })

  return truncateRawDiff(diff)
}

export async function listOpenPullRequestsFromEnv(env: GitMcpEnv): Promise<PullRequestInfo[]> {
  const remote = requireGitRemote(env)
  const headers = buildAuthHeaders(env)

  switch (remote.provider) {
    case "github":
      return listGitHubPullRequests(remote, headers)
    case "gitlab":
      return listGitLabPullRequests(remote, headers)
    case "bitbucket":
      return listBitbucketPullRequests(remote, headers)
    default:
      throw new Error(`Unsupported git provider: ${remote.provider}`)
  }
}

export async function getPullRequestFromEnv(
  env: GitMcpEnv,
  pullRequestId: string | number,
): Promise<PullRequestInfo> {
  const pullRequests = await listOpenPullRequestsFromEnv(env)
  const match = pullRequests.find((pullRequest) => String(pullRequest.id) === String(pullRequestId))
  if (!match) {
    throw new Error(`Pull request ${pullRequestId} was not found among open pull requests.`)
  }

  return match
}

export async function getPullRequestMarkdownFromEnv(
  env: GitMcpEnv,
  pullRequestId: string | number,
): Promise<string> {
  const pullRequest = await getPullRequestFromEnv(env, pullRequestId)
  const linkedIssueIdentifier = parseIssueIdentifierFromPullRequest(pullRequest)
  return formatPullRequestMarkdown(pullRequest, { linkedIssueIdentifier })
}

export async function getPullRequestDiffFromEnv(
  env: GitMcpEnv,
  params: { pullRequestId?: string | number; sourceBranch?: string; targetBranch?: string },
): Promise<string> {
  let sourceBranch = params.sourceBranch
  let targetBranch = params.targetBranch

  if (params.pullRequestId !== undefined && (!sourceBranch || !targetBranch)) {
    if (hasConfiguredGitRemote(env)) {
      const pullRequest = await getPullRequestFromEnv(env, params.pullRequestId)
      sourceBranch = pullRequest.sourceBranch
      targetBranch = pullRequest.targetBranch
    } else {
      throw new Error(
        'Git remote is not configured for provider API lookups. Pass sourceBranch and targetBranch (for example sourceBranch: "feature/my-branch", targetBranch: "main") to fetch a local git diff.',
      )
    }
  }

  if (!sourceBranch || !targetBranch) {
    throw new Error("Source and target branches are required to fetch a pull request diff.")
  }

  if (canUseLocalGitDiff(env, sourceBranch, targetBranch)) {
    try {
      return await getLocalGitPullRequestDiff(env.workspaceFolder!, sourceBranch, targetBranch)
    } catch (localError) {
      if (!hasConfiguredGitRemote(env)) {
        throw localError
      }
      // Fall back to the provider API when local git cannot resolve the branches.
    }
  }

  return getProviderPullRequestDiff(env, sourceBranch, targetBranch)
}

export async function listOpenPullRequestsMarkdown(env: GitMcpEnv): Promise<string> {
  const pullRequests = await listOpenPullRequestsFromEnv(env)
  if (pullRequests.length === 0) {
    return "# Open pull requests\n\n_No open pull requests found._"
  }

  const lines = ["# Open pull requests", ""]
  for (const pullRequest of pullRequests) {
    const linkedIssue = parseIssueIdentifierFromPullRequest(pullRequest)
    lines.push(
      `- **#${pullRequest.id}** — ${pullRequest.title ?? "Untitled"} (${pullRequest.sourceBranch ?? "?"} → ${pullRequest.targetBranch ?? "?"})${linkedIssue ? ` — linked issue ${linkedIssue}` : ""} — ${pullRequest.url}`,
    )
  }

  return lines.join("\n")
}

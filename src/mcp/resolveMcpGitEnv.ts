import { execFile } from "child_process"
import { promisify } from "util"

import { parseRemoteUrl } from "src/gitProviders/parseRemoteUrl"
import { GitProviderId, ParsedRemote } from "src/gitProviders/types"
import { ExtensionContext, workspace } from "vscode"

import { resolveGitProviderAuth, settingsFromContext } from "./mcpGitAuth"

export type McpServerEnv = Record<string, string>

const execFileAsync = promisify(execFile)

export async function readOriginRemoteUrl(workspaceFolder: string): Promise<string | undefined> {
  for (const args of [
    ["remote", "get-url", "origin"],
    ["config", "--get", "remote.origin.url"],
  ] as const) {
    try {
      const { stdout } = await execFileAsync("git", [...args], { cwd: workspaceFolder })
      const url = stdout.trim()
      if (url) {
        return url
      }
    } catch {
      // Try the next git command.
    }
  }

  return undefined
}

export function gitEnvFromRemote(
  remote: ParsedRemote,
  auth: { accessToken?: string; authHeader?: string },
): McpServerEnv {
  const env: McpServerEnv = {
    GIT_PROVIDER: remote.provider,
    GIT_REMOTE_OWNER: remote.owner,
    GIT_REMOTE_REPO: remote.repo,
  }

  if (remote.host) {
    env.GIT_REMOTE_HOST = remote.host
  }
  if (auth.accessToken) {
    env.GIT_ACCESS_TOKEN = auth.accessToken
  }
  if (auth.authHeader) {
    env.GIT_AUTH_HEADER = auth.authHeader
  }

  return env
}

export async function resolveParsedOriginRemote(
  workspaceFolder: string | undefined,
  providerId?: GitProviderId,
): Promise<ParsedRemote | null> {
  if (!workspaceFolder) {
    return null
  }

  const originUrl = await readOriginRemoteUrl(workspaceFolder)
  return parseRemoteUrl(originUrl, providerId)
}

export async function buildGitProviderEnv(
  context: ExtensionContext,
  providerId?: GitProviderId,
): Promise<McpServerEnv> {
  if (!providerId) {
    return {}
  }

  const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath
  const settings = settingsFromContext(context)

  let remote: ParsedRemote | null = null

  try {
    const { Controller } = await import("src/controller")
    remote = Controller.gitProviderService?.getParsedOriginRemote() ?? null
  } catch {
    // Controller may not be initialized yet when MCP env is built.
  }

  if (!remote) {
    remote = await resolveParsedOriginRemote(workspaceFolder, providerId)
  }

  if (!remote) {
    return { GIT_PROVIDER: providerId }
  }

  const auth = await resolveGitProviderAuth(context, remote.provider, settings)
  return gitEnvFromRemote(remote, auth)
}

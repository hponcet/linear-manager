import { LinearSecretKeys } from "src/linear/auth"
import { SettingsVscState, VscStateKeys } from "src/vscStates"
import { cursor, ExtensionContext, McpStdioServerDefinition, workspace } from "vscode"

import { buildGitProviderEnv, type McpServerEnv } from "./resolveMcpGitEnv"

export const MCP_PROVIDER_ID = "linearManager.mcp"
export const MCP_SERVER_LABEL = "Linear Manager"
export const MCP_CURSOR_SERVER_NAME = MCP_SERVER_LABEL

export type { McpServerEnv } from "./resolveMcpGitEnv"

export async function buildLinearMcpServerEnv(
  context: ExtensionContext,
): Promise<McpServerEnv | null> {
  const linearAccessToken = await context.secrets.get(LinearSecretKeys.accessToken)
  if (!linearAccessToken) {
    return null
  }

  const env: McpServerEnv = {
    LINEAR_ACCESS_TOKEN: linearAccessToken,
  }

  const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath
  if (workspaceFolder) {
    env.WORKSPACE_FOLDER = workspaceFolder
  }

  const settings = context.globalState.get<SettingsVscState>(VscStateKeys.branchesSettings) ?? {}
  const gitEnv = await buildGitProviderEnv(context, settings.gitProvider)
  return { ...env, ...gitEnv }
}

export function createLinearMcpServerDefinition(
  context: ExtensionContext,
  env: McpServerEnv,
): McpStdioServerDefinition {
  const serverPath = context.asAbsolutePath("dist/linearMcpServer.js")
  return new McpStdioServerDefinition(MCP_SERVER_LABEL, "node", [serverPath], env)
}

export function createCursorMcpServerConfig(
  context: ExtensionContext,
  env: McpServerEnv,
): cursor.mcp.StdioServerConfig {
  const serverPath = context.asAbsolutePath("dist/linearMcpServer.js")
  return {
    name: MCP_CURSOR_SERVER_NAME,
    server: {
      command: "node",
      args: [serverPath],
      env: { ...env },
    },
  }
}

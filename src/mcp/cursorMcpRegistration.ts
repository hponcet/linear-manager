import { ExtensionContext, cursor } from "vscode"

import {
  buildLinearMcpServerEnv,
  createCursorMcpServerConfig,
  MCP_CURSOR_SERVER_NAME,
} from "./mcpEnvBuilder"

export function isCursorMcpRegistrationAvailable(): boolean {
  return typeof cursor?.mcp?.registerServer === "function"
}

export function unregisterCursorMcpServer(): void {
  if (typeof cursor?.mcp?.unregisterServer !== "function") {
    return
  }

  cursor.mcp.unregisterServer(MCP_CURSOR_SERVER_NAME)
}

export async function syncCursorMcpServerRegistration(context: ExtensionContext): Promise<void> {
  if (!isCursorMcpRegistrationAvailable()) {
    return
  }

  const env = await buildLinearMcpServerEnv(context)
  if (!env) {
    unregisterCursorMcpServer()
    return
  }

  cursor.mcp.registerServer(createCursorMcpServerConfig(context, env))
}

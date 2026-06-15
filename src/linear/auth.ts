import { LinearClient } from "@linear/sdk"
import { Controller } from "src/controller"
import { isExtensionSession } from "src/extensionSession"
import { ExtensionContext, authentication, window } from "vscode"

import { CommandContext, setCommandContext } from "../commandsContext"
import { notifyLinearMcpDefinitionsChanged } from "../mcp/registerLinearMcpServer"

let linearClient: LinearClient | null = null

export enum LinearSecretKeys {
  accessToken = "linearAccessToken",
}

export async function initLinearClient(
  context: ExtensionContext,
  sessionId?: number,
): Promise<void> {
  try {
    const accessToken = await context.secrets.get(LinearSecretKeys.accessToken)

    if (accessToken) {
      if (sessionId !== undefined && !isExtensionSession(sessionId)) {
        return
      }

      linearClient = new LinearClient({
        accessToken,
        headers: {
          "public-file-urls-expire-in": "60",
        },
      })
      setCommandContext(CommandContext.linearAccountConnected, true)
      notifyLinearMcpDefinitionsChanged()
      await Controller.initialize(context, sessionId)
    } else {
      setCommandContext(CommandContext.linearAccountConnected, false)
    }
  } catch (error) {
    window.showErrorMessage(
      `Failed to initialize Linear client: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    setCommandContext(CommandContext.linearAccountConnected, false)
  }
}

export async function linearConnect(context: ExtensionContext) {
  try {
    const session = await authentication.getSession("linear", ["read", "write"], {
      createIfNone: true,
    })

    if (session) {
      context.secrets.store(LinearSecretKeys.accessToken, session.accessToken)

      linearClient = new LinearClient({
        accessToken: session.accessToken,
        headers: {
          "public-file-urls-expire-in": "60",
        },
      })

      await Controller.initialize(context)
      setCommandContext(CommandContext.linearAccountConnected, true)
      notifyLinearMcpDefinitionsChanged()
      window.showInformationMessage("Successfully connected to Linear API")
    } else {
      window.showErrorMessage("Failed to acquire a Linear API session.")
      setCommandContext(CommandContext.linearAccountConnected, false)
    }
  } catch (error) {
    window.showErrorMessage(
      `Failed to connect to Linear API: ${error instanceof Error ? error.message : String(error)}`,
    )
    setCommandContext(CommandContext.linearAccountConnected, false)
  }
}

export async function linearDisconnect(context: ExtensionContext) {
  await context.secrets.delete(LinearSecretKeys.accessToken)
  linearClient = null
  Controller.linearService?.invalidateAll()
  Controller.dispose()
  setCommandContext(CommandContext.linearAccountConnected, false)
  notifyLinearMcpDefinitionsChanged()
  window.showInformationMessage("Successfully disconnected from Linear API")
}

export function getLinearClient(): LinearClient | null {
  return linearClient
}

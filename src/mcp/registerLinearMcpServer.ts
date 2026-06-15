import { isExtensionActive } from "src/extensionSession"
import { ExtensionContext, EventEmitter, lm, window, workspace } from "vscode"

import {
  isCursorMcpRegistrationAvailable,
  syncCursorMcpServerRegistration,
  unregisterCursorMcpServer,
} from "./cursorMcpRegistration"
import {
  buildLinearMcpServerEnv,
  createLinearMcpServerDefinition,
  MCP_PROVIDER_ID,
} from "./mcpEnvBuilder"

const didChangeMcpServerDefinitions = new EventEmitter<void>()

let extensionContext: ExtensionContext | undefined

async function syncMcpRegistrations(): Promise<void> {
  if (!extensionContext || !isExtensionActive()) {
    return
  }

  await syncCursorMcpServerRegistration(extensionContext)
}

export function notifyLinearMcpDefinitionsChanged(): void {
  if (!isExtensionActive()) {
    return
  }

  try {
    didChangeMcpServerDefinitions.fire()
  } catch {
    // MCP listeners may already be disposed during extension shutdown.
  }

  void syncMcpRegistrations()
}

export function registerLinearMcpServer(context: ExtensionContext): void {
  extensionContext = context

  context.subscriptions.push({
    dispose: () => {
      unregisterCursorMcpServer()
      extensionContext = undefined
    },
  })

  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(() => {
      void syncMcpRegistrations()
    }),
  )

  if (typeof lm?.registerMcpServerDefinitionProvider === "function") {
    try {
      context.subscriptions.push(
        lm.registerMcpServerDefinitionProvider(MCP_PROVIDER_ID, {
          onDidChangeMcpServerDefinitions: didChangeMcpServerDefinitions.event,
          provideMcpServerDefinitions: async () => {
            const env = await buildLinearMcpServerEnv(context)
            if (!env) {
              return []
            }

            return [createLinearMcpServerDefinition(context, env)]
          },
          resolveMcpServerDefinition: async () => {
            const env = await buildLinearMcpServerEnv(context)
            if (!env) {
              throw new Error(
                "Connect your Linear account in Linear Manager before starting the MCP server.",
              )
            }

            return createLinearMcpServerDefinition(context, env)
          },
        }),
      )
    } catch (error) {
      console.warn("[Linear Manager] Failed to register MCP server provider:", error)
      if (!isCursorMcpRegistrationAvailable()) {
        void window.showWarningMessage(
          "Linear Manager could not register its MCP server. You may need a newer VS Code or Cursor version.",
        )
      }
    }
  } else if (!isCursorMcpRegistrationAvailable()) {
    console.warn("[Linear Manager] MCP registration API is unavailable in this editor.")
  }

  void syncMcpRegistrations()
}

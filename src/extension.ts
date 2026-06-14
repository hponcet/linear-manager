import { ExtensionContext, window } from "vscode"

import { registerCommands } from "./commands"
import { CommandContext, setCommandContext } from "./commandsContext"
import { linearManagerUriHandler } from "./gitProviders/linearManagerUriHandler"
import { initLinearClient } from "./linear/auth"

export async function activate(context: ExtensionContext) {
  setCommandContext(CommandContext.linearExtensionLoaded, false)
  setCommandContext(CommandContext.gitProviderAuthenticated, false)

  context.subscriptions.push(window.registerUriHandler(linearManagerUriHandler))

  registerCommands(context)
  await initLinearClient(context)
  setCommandContext(CommandContext.linearExtensionLoaded, true)
}

export function deactivate() {
  // Clean up resources if needed
}

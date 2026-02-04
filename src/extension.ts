import { ExtensionContext } from "vscode"

import { registerCommands } from "./commands"
import { CommandContext, setCommandContext } from "./commandsContext"
import { initLinearClient } from "./linear/auth"

export async function activate(context: ExtensionContext) {
  setCommandContext(CommandContext.linearExtensionLoaded, false)

  registerCommands(context)
  await initLinearClient(context)
  setCommandContext(CommandContext.linearExtensionLoaded, true)
}

export function deactivate() {
  // Clean up resources if needed
}

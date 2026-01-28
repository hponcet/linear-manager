import { ExtensionContext } from "vscode";
import { registerCommands } from "./commands";
import { initLinearClient } from "./linear/auth";
import { CommandContext, setCommandContext } from "./commandsContext";

export async function activate(context: ExtensionContext) {
  setCommandContext(CommandContext.linearExtensionLoaded, false);

  registerCommands(context);
  await initLinearClient(context);
  setCommandContext(CommandContext.linearExtensionLoaded, true);
}

export function deactivate() {}

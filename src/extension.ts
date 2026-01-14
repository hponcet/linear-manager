import { ExtensionContext } from "vscode";
import { registerCommands } from "./commands";
import { initLinearClient } from "./linear/auth";
import { CommandContext, setCommandContext } from "./commandsContext";
import { Controller } from "./controller";

export async function activate(context: ExtensionContext) {
  setCommandContext(
    CommandContext.linearAccountConnected,
    await initLinearClient(context)
  );

  registerCommands(context);

  await Controller.initialize(context);

  setCommandContext(CommandContext.linearExtensionLoaded, true);
}

export function deactivate() {}

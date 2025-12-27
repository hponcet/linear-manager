import { ExtensionContext, window } from "vscode";
import { registerCommands } from "./commands";
import { initLinearClient } from "./linear/auth";
import { CommandContext, setCommandContext } from "./commandsContext";
import { LinearIssuesViewer } from "./linear/MyIssuesViewer";

export async function activate(context: ExtensionContext) {
  setCommandContext(
    CommandContext.linearAccountConnected,
    await initLinearClient(context)
  );

  registerCommands(context);

  new LinearIssuesViewer(context);

  setCommandContext(CommandContext.linearExtensionLoaded, true);
}

export function deactivate() {}

import { ExtensionContext, commands, window } from "vscode";
import { linearConnect } from "./linear/auth";

export enum Commands {
  linearAuthentication = "linearManager.connect",
}

export function registerCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(Commands.linearAuthentication, () =>
      linearConnect(context)
    )
  );
}

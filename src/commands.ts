import { ExtensionContext, commands } from "vscode";
import { linearConnect, linearDisconnect } from "./linear/auth";
import { Commands } from "./constants";

export function registerCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(Commands.connect, () => linearConnect(context)),
  );
  context.subscriptions.push(
    commands.registerCommand(Commands.disconnect, () => {
      linearDisconnect(context);
    }),
  );
}

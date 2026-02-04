import { ExtensionContext, commands } from "vscode"

import { Commands } from "./constants"
import { linearConnect, linearDisconnect } from "./linear/auth"

export function registerCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(Commands.connect, () => linearConnect(context)),
  )
  context.subscriptions.push(
    commands.registerCommand(Commands.disconnect, () => {
      linearDisconnect(context)
    }),
  )
}

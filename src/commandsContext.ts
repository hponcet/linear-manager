import { commands } from "vscode"

export enum CommandContext {
  linearAccountConnected = "linearToCode:isLinearAuthenticated",
  linearExtensionLoaded = "linearToCode:isLinearExtensionLoaded",
  gitExtensionLoaded = "linearToCode:isGitExtensionLoaded",
  gitProviderAuthenticated = "linearToCode:isGitProviderAuthenticated",
  isCursor = "linearToCode:isCursor",
}

export function setCommandContext(key: CommandContext | string, value: any) {
  return commands.executeCommand("setContext", key, value)
}

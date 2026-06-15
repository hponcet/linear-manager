import { commands } from "vscode"

export enum CommandContext {
  linearAccountConnected = "linearManager:isLinearAuthenticated",
  linearExtensionLoaded = "linearManager:isLinearExtensionLoaded",
  gitExtensionLoaded = "linearManager:isGitExtensionLoaded",
  gitProviderAuthenticated = "linearManager:isGitProviderAuthenticated",
  isCursor = "linearManager:isCursor",
}

export function setCommandContext(key: CommandContext | string, value: any) {
  return commands.executeCommand("setContext", key, value)
}

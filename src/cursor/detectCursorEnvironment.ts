import { env, commands } from "vscode"

import { COMPOSER_OPEN_COMMANDS } from "./composerCommands"

import { CommandContext, setCommandContext } from "../commandsContext"

let cachedIsCursor = false
let cachedComposerCommand: string | undefined

export function isCursorEditorFromValues(appName: string, uriScheme: string): boolean {
  const normalizedAppName = appName.toLowerCase()
  const normalizedUriScheme = uriScheme.toLowerCase()
  return normalizedAppName.includes("cursor") || normalizedUriScheme === "cursor"
}

export function isCursorEditor(): boolean {
  return isCursorEditorFromValues(env.appName, env.uriScheme)
}

export function getCursorComposerCommand(): string | undefined {
  return cachedComposerCommand
}

export async function refreshCursorCommandContext(): Promise<boolean> {
  cachedIsCursor = isCursorEditor()
  await setCommandContext(CommandContext.isCursor, cachedIsCursor)

  if (!cachedIsCursor) {
    cachedComposerCommand = undefined
    return false
  }

  const candidateCommands = [...COMPOSER_OPEN_COMMANDS]

  for (const command of candidateCommands) {
    try {
      const commandsList = await commands.getCommands(true)
      if (commandsList.includes(command)) {
        cachedComposerCommand = command
        return true
      }
    } catch {
      // Ignore and try the next command.
    }
  }

  cachedComposerCommand = undefined
  return cachedIsCursor
}

export async function ensureCursorEnvironment(): Promise<boolean> {
  await refreshCursorCommandContext()
  return cachedIsCursor
}

export function isCursorEnvironmentReady(): boolean {
  return cachedIsCursor
}

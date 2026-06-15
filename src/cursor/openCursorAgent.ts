import { commands, env, window } from "vscode"

import {
  buildComposerOpenCommandOrder,
  COMPOSER_PASTE_COMMAND,
  COMPOSER_UI_READY_DELAY_MS,
} from "./composerCommands"
import { getCursorComposerCommand, isCursorEnvironmentReady } from "./detectCursorEnvironment"

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readClipboardText(): Promise<string | undefined> {
  try {
    return await env.clipboard.readText()
  } catch {
    return undefined
  }
}

async function tryOpenComposer(commandsToTry: string[]): Promise<string | undefined> {
  const availableCommands = new Set(await commands.getCommands(true))

  for (const command of commandsToTry) {
    if (!availableCommands.has(command)) {
      continue
    }

    try {
      await commands.executeCommand(command)
      return command
    } catch {
      // Try the next command.
    }
  }

  return undefined
}

async function tryPastePromptIntoComposer(): Promise<boolean> {
  try {
    await commands.executeCommand(COMPOSER_PASTE_COMMAND)
    return true
  } catch {
    return false
  }
}

export async function openCursorAgentWithPrompt(prompt: string): Promise<void> {
  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    throw new Error("Prompt is required to open the Cursor agent.")
  }

  if (!isCursorEnvironmentReady()) {
    throw new Error("Start work with agent and Review with agent are available in Cursor only.")
  }

  const previousClipboard = await readClipboardText()

  try {
    await env.clipboard.writeText(trimmedPrompt)

    const openedCommand = await tryOpenComposer(
      buildComposerOpenCommandOrder(getCursorComposerCommand()),
    )

    if (!openedCommand) {
      throw new Error(
        "Could not open Cursor Composer automatically. The prompt was copied to your clipboard — paste it into a new agent chat.",
      )
    }

    await sleep(COMPOSER_UI_READY_DELAY_MS)

    const pasted = await tryPastePromptIntoComposer()
    if (!pasted) {
      void window.showInformationMessage(
        "Cursor agent opened. The prompt is on your clipboard — paste it with Ctrl+V if the input is empty.",
      )
      return
    }
  } finally {
    if (previousClipboard !== undefined) {
      try {
        await env.clipboard.writeText(previousClipboard)
      } catch {
        // Keep the prompt on the clipboard when restore fails.
      }
    }
  }
}

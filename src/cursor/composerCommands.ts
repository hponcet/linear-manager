export const COMPOSER_OPEN_COMMANDS = [
  "composer.newAgentChat",
  "composer.startComposer",
  "aichat.newchataction",
  "cursor.openComposer",
  "workbench.action.chat.open",
] as const

export const COMPOSER_UI_READY_DELAY_MS = 400

export const COMPOSER_PASTE_COMMAND = "editor.action.clipboardPasteAction"

export function buildComposerOpenCommandOrder(preferredCommand?: string): string[] {
  if (!preferredCommand) {
    return [...COMPOSER_OPEN_COMMANDS]
  }

  return [
    preferredCommand,
    ...COMPOSER_OPEN_COMMANDS.filter((command) => command !== preferredCommand),
  ]
}

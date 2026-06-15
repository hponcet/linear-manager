import * as assert from "assert"

import {
  buildComposerOpenCommandOrder,
  COMPOSER_OPEN_COMMANDS,
} from "../../cursor/composerCommands"

suite("composerCommands", () => {
  test("prefers composer.newAgentChat for opening agent chats", () => {
    assert.strictEqual(COMPOSER_OPEN_COMMANDS[0], "composer.newAgentChat")
  })

  test("buildComposerOpenCommandOrder puts the cached command first", () => {
    assert.deepStrictEqual(buildComposerOpenCommandOrder("cursor.openComposer"), [
      "cursor.openComposer",
      "composer.newAgentChat",
      "composer.startComposer",
      "aichat.newchataction",
      "workbench.action.chat.open",
    ])
  })

  test("buildComposerOpenCommandOrder returns defaults when no preference exists", () => {
    assert.deepStrictEqual(buildComposerOpenCommandOrder(), [...COMPOSER_OPEN_COMMANDS])
  })
})

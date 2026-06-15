import * as assert from "assert"

import { openCursorAgentWithPrompt } from "../../cursor/openCursorAgent"

suite("openCursorAgentWithPrompt", () => {
  test("rejects empty prompts", async () => {
    await assert.rejects(openCursorAgentWithPrompt("   "), /Prompt is required/)
  })
})

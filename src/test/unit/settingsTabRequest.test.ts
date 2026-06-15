import * as assert from "assert"

import { resolveSettingsTabFromRequest } from "../../webviews/views/SettingsWebview/settingsTabRequest"

suite("resolveSettingsTabFromRequest", () => {
  test("applies the requested tab when a tab request id is present", () => {
    assert.strictEqual(resolveSettingsTabFromRequest("git", 2, "workflow"), "workflow")
  })

  test("keeps the current tab when no tab request id was sent", () => {
    assert.strictEqual(resolveSettingsTabFromRequest("agent", undefined, "workflow"), "agent")
  })

  test("reapplies the same requested tab when the request id increments again", () => {
    assert.strictEqual(resolveSettingsTabFromRequest("git", 3, "workflow"), "workflow")
  })
})

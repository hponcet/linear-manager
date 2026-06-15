import * as assert from "assert"

import {
  activateExtensionSession,
  deactivateExtensionSession,
  isExtensionActive,
  isExtensionSession,
} from "../../extensionSession"

suite("extensionSession", () => {
  teardown(() => {
    deactivateExtensionSession()
  })

  test("tracks the active extension session", () => {
    const sessionId = activateExtensionSession()

    assert.strictEqual(isExtensionActive(), true)
    assert.strictEqual(isExtensionSession(sessionId), true)
    assert.strictEqual(isExtensionSession(sessionId - 1), false)
  })

  test("invalidates the session after deactivate", () => {
    const sessionId = activateExtensionSession()

    deactivateExtensionSession()

    assert.strictEqual(isExtensionActive(), false)
    assert.strictEqual(isExtensionSession(sessionId), false)
  })

  test("starts a new session after re-activate", () => {
    const firstSession = activateExtensionSession()
    deactivateExtensionSession()
    const secondSession = activateExtensionSession()

    assert.notStrictEqual(secondSession, firstSession)
    assert.strictEqual(isExtensionSession(firstSession), false)
    assert.strictEqual(isExtensionSession(secondSession), true)
  })
})

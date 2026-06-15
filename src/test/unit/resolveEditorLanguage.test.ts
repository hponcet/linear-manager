import * as assert from "assert"

import { resolveEditorLanguage } from "../../cursor/resolveEditorLanguage"

suite("resolveEditorLanguage", () => {
  test("returns a human-readable language name for a locale", () => {
    const english = resolveEditorLanguage("en")
    const french = resolveEditorLanguage("fr")

    assert.ok(english.length > 0)
    assert.ok(french.length > 0)
    assert.notStrictEqual(english.toLowerCase(), french.toLowerCase())
  })

  test("falls back to English when locale is missing", () => {
    const language = resolveEditorLanguage()

    assert.ok(language.length > 0)
  })
})

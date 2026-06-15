import * as assert from "assert"

import { parseTextWithLinks } from "../../webviews/utils/parseTextWithLinks"

suite("parseTextWithLinks", () => {
  test("parses markdown links into segments", () => {
    const segments = parseTextWithLinks(
      "Open [Account settings](https://bitbucket.org/account/settings/) first.",
    )

    assert.strictEqual(segments.length, 3)
    assert.deepStrictEqual(segments[0], { type: "text", value: "Open " })
    assert.deepStrictEqual(segments[1], {
      type: "link",
      label: "Account settings",
      url: "https://bitbucket.org/account/settings/",
    })
    assert.deepStrictEqual(segments[2], { type: "text", value: " first." })
  })

  test("returns plain text when no links are present", () => {
    const segments = parseTextWithLinks("No links here.")

    assert.deepStrictEqual(segments, [{ type: "text", value: "No links here." }])
  })

  test("parses multiple links in one string", () => {
    const segments = parseTextWithLinks(
      "[First](https://example.com/a) and [Second](https://example.com/b)",
    )

    assert.strictEqual(segments.length, 3)
    assert.strictEqual(segments[0].type, "link")
    assert.deepStrictEqual(segments[1], { type: "text", value: " and " })
    assert.strictEqual(segments[2].type, "link")
  })
})

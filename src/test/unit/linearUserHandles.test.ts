import * as assert from "assert"

import { findUserHandles } from "../../webviews/components/Editor/markdownPlugins/MentionPlugin/LinearUserHandleDecoration"

suite("Linear user handles", () => {
  test("decorates a handle only where Linear would render a mention", () => {
    for (const [text, expected] of [
      ["@hugues.poncet", ["hugues.poncet"]],
      ["Ping @alice and @bob-2 please", ["alice", "bob-2"]],
      ["(@alice)", ["alice"]],
      ["Write to markdown@example.com instead", []],
      ["email@domain.tld and @real", ["real"]],
      ["no-at-sign here", []],
      ["@", []],
    ] as const) {
      assert.deepStrictEqual(
        findUserHandles(text).map((handle) => handle.label),
        [...expected],
        text,
      )
    }
  })

  test("reports the exact range so the decoration covers the @ sign", () => {
    const [handle] = findUserHandles("Ping @alice now")

    assert.deepStrictEqual(handle, { from: 5, to: 11, label: "alice" })
  })
})

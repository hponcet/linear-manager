import * as assert from "assert"

import { parseLinearEmbedJson } from "../../webviews/components/Editor/markdownEscaping"

suite("parseLinearEmbedJson", () => {
  test("accepts a signature Linear escaped as Markdown", () => {
    // Observed on a live Linear description: the base64url signature contains `_`, which
    // Linear's Markdown escaper turns into `\_` inside the embed payload.
    const payload = String.raw`{"href":"https://uploads.linear.app/a/b?signature=LBr-\_apGWB4","name":"f.json"}`

    assert.throws(() => JSON.parse(payload), "the raw payload is what breaks today")
    assert.deepStrictEqual(parseLinearEmbedJson(payload), {
      href: "https://uploads.linear.app/a/b?signature=LBr-_apGWB4",
      name: "f.json",
    })
  })

  test("keeps real JSON escapes intact", () => {
    const payload = String.raw`{"quote":"a \"b\" c","backslash":"a\\b","newline":"a\nb","unicode":"é"}`

    assert.deepStrictEqual(parseLinearEmbedJson(payload), {
      quote: 'a "b" c',
      backslash: "a\\b",
      newline: "a\nb",
      unicode: "é",
    })
  })

  test("does not strip the escape from an escaped backslash before punctuation", () => {
    const payload = String.raw`{"value":"a\\_b"}`

    assert.deepStrictEqual(parseLinearEmbedJson(payload), { value: "a\\_b" })
  })

  test("still rejects payloads that are not JSON at all", () => {
    assert.throws(() => parseLinearEmbedJson("not json"))
  })
})

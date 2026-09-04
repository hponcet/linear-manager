import * as assert from "assert"

import { escapeLinearTableCellPipes } from "../../webviews/components/Editor/markdownPlugins/LinearTable"
import { sortRowsByColumn } from "../../webviews/components/Editor/markdownPlugins/TablePlugin/tableUtils"

suite("tableUtils", () => {
  test("distinguishes code-span pipes from table separators", () => {
    assert.strictEqual(escapeLinearTableCellPipes("plain | value"), "plain \\| value")
    assert.strictEqual(escapeLinearTableCellPipes("`code|value`"), "`code|value`")
    assert.strictEqual(
      escapeLinearTableCellPipes("\\`literal|backticks\\`"),
      "\\`literal\\|backticks\\`",
    )
  })

  test("sorts naturally and preserves equal-value order", () => {
    const rows = [
      { id: "a", value: "Item 10" },
      { id: "b", value: "item 2" },
      { id: "c", value: "Item 2" },
    ]

    assert.deepStrictEqual(
      sortRowsByColumn(rows, (row) => row.value, "ascending").map((row) => row.id),
      ["b", "c", "a"],
    )
    assert.deepStrictEqual(
      sortRowsByColumn(rows, (row) => row.value, "descending").map((row) => row.id),
      ["a", "b", "c"],
    )
  })
})

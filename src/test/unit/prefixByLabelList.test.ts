import * as assert from "assert"

import {
  filterCompleteLabelPrefixes,
  mergeLabelsById,
  mergePersistedRowsWithDrafts,
} from "../../webviews/utils/prefixByLabelList"

suite("prefixByLabelList utils", () => {
  test("mergeLabelsById deduplicates labels and keeps saved entries", () => {
    const result = mergeLabelsById(
      [{ id: "1", name: "Bug", color: "#f00" }],
      [{ id: "2", name: "Feature", color: "#0f0" }],
      [{ id: "1", name: "Bug (saved)", color: "#111" }],
    )

    assert.deepStrictEqual(result.map((label) => label.id).sort(), ["1", "2"])
    assert.strictEqual(result.find((label) => label.id === "1")?.name, "Bug (saved)")
  })

  test("filterCompleteLabelPrefixes keeps rows with both label and prefix", () => {
    const result = filterCompleteLabelPrefixes([
      {
        label: { id: "1", name: "Bug", color: "#f00" },
        prefix: "fix",
      },
    ])

    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0]?.prefix, "fix")
  })

  test("filterCompleteLabelPrefixes drops draft rows missing label or prefix", () => {
    const result = filterCompleteLabelPrefixes([
      { label: null, prefix: "fix" },
      {
        label: { id: "1", name: "Bug", color: "#f00" },
        prefix: "",
      },
      { label: null, prefix: "" },
    ])

    assert.deepStrictEqual(result, [])
  })

  test("mergePersistedRowsWithDrafts keeps in-progress rows after persisted settings sync", () => {
    const result = mergePersistedRowsWithDrafts(
      [{ label: { id: "1", name: "Bug", color: "#f00" }, prefix: "fix" }],
      [
        { label: { id: "1", name: "Bug", color: "#f00" }, prefix: "fix" },
        { label: { id: "2", name: "Feature", color: "#0f0" }, prefix: "" },
      ],
    )

    assert.strictEqual(result.length, 2)
    assert.strictEqual(result[1]?.label?.name, "Feature")
    assert.strictEqual(result[1]?.prefix, "")
  })
})

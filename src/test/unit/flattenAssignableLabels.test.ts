import * as assert from "assert"

import { flattenAssignableLabels, LabelWithChildren } from "../../linear/flattenAssignableLabels"

type PaginatedConnection<T> = {
  nodes: T[]
  pageInfo: { hasPreviousPage: boolean }
  fetchPrevious: () => Promise<PaginatedConnection<T>>
}

function createConnection<T>(nodes: T[]): PaginatedConnection<T> {
  return {
    nodes,
    pageInfo: { hasPreviousPage: false },
    fetchPrevious: async () => createConnection([]),
  }
}

function createLabel(
  id: string,
  options: { isGroup?: boolean; children?: LabelWithChildren[] } = {},
): LabelWithChildren {
  const childItems = options.children ?? []

  return {
    id,
    isGroup: options.isGroup ?? false,
    children: async () => createConnection(childItems),
  }
}

suite("flattenAssignableLabels", () => {
  test("returns leaf labels and skips groups", async () => {
    const labels = [createLabel("group-1", { isGroup: true }), createLabel("leaf-1")]

    const result = await flattenAssignableLabels(labels)

    assert.deepStrictEqual(
      result.map((label) => label.id),
      ["leaf-1"],
    )
  })

  test("includes nested child labels from groups", async () => {
    const labels = [
      createLabel("group-1", {
        isGroup: true,
        children: [
          createLabel("leaf-1"),
          createLabel("group-2", {
            isGroup: true,
            children: [createLabel("leaf-2")],
          }),
        ],
      }),
      createLabel("leaf-3"),
    ]

    const result = await flattenAssignableLabels(labels)

    assert.deepStrictEqual(result.map((label) => label.id).sort(), ["leaf-1", "leaf-2", "leaf-3"])
  })
})

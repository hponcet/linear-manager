import * as assert from "assert"

import { fetchAllConnectionPages } from "../../linear/pagination"

type TestNode = { id: string }

function createConnectionAt(pages: TestNode[][], startIndex: number) {
  const getPage = (index: number) => ({
    nodes: pages[index] ?? [],
    pageInfo: {
      hasPreviousPage: index > 0,
      hasNextPage: index < pages.length - 1,
    },
    fetchPrevious: async () => getPage(Math.max(0, index - 1)),
    fetchNext: async () => getPage(Math.min(pages.length - 1, index + 1)),
  })

  return getPage(startIndex)
}

suite("pagination utils", () => {
  test("fetchAllConnectionPages follows fetchNext for forward-paginated connections", async () => {
    const connection = createConnectionAt(
      [[{ id: "label-1" }], [{ id: "label-2" }], [{ id: "Feature" }]],
      0,
    )

    const result = await fetchAllConnectionPages(connection)

    assert.deepStrictEqual(
      result.map((node) => node.id),
      ["label-1", "label-2", "Feature"],
    )
  })

  test("fetchAllConnectionPages collects every page when starting from a middle page", async () => {
    const connection = createConnectionAt(
      [[{ id: "label-1" }], [{ id: "label-2" }], [{ id: "Feature" }]],
      1,
    )

    const result = await fetchAllConnectionPages(connection)

    assert.deepStrictEqual(
      result.map((node) => node.id),
      ["label-1", "label-2", "Feature"],
    )
  })
})

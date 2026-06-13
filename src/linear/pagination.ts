type PaginatedConnection<T> = {
  nodes: T[]
  pageInfo: { hasPreviousPage: boolean }
  fetchPrevious: () => Promise<PaginatedConnection<T>>
}

export async function fetchAllPreviousPages<T>(connection: PaginatedConnection<T>): Promise<T[]> {
  const nodes = [...connection.nodes]
  let current = connection

  while (current.pageInfo.hasPreviousPage) {
    current = await current.fetchPrevious()
    nodes.unshift(...current.nodes)
  }

  return nodes
}

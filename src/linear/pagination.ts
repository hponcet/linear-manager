type PaginatedConnection<T> = {
  nodes: T[]
  pageInfo: {
    hasPreviousPage: boolean
    hasNextPage?: boolean
  }
  fetchPrevious: () => Promise<PaginatedConnection<T>>
  fetchNext?: () => Promise<PaginatedConnection<T>>
}

export async function fetchAllConnectionPages<T>(connection: PaginatedConnection<T>): Promise<T[]> {
  let head = connection

  while (head.pageInfo.hasPreviousPage) {
    head = await head.fetchPrevious()
  }

  const nodes = [...head.nodes]
  let tail = head

  while (tail.pageInfo.hasNextPage && tail.fetchNext) {
    tail = await tail.fetchNext()
    nodes.push(...tail.nodes)
  }

  return nodes
}

export async function fetchAllPreviousPages<T>(connection: PaginatedConnection<T>): Promise<T[]> {
  return fetchAllConnectionPages(connection)
}

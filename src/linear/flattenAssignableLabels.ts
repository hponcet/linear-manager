import { fetchAllPreviousPages } from "./pagination"

type PaginatedConnection<T> = {
  nodes: T[]
  pageInfo: { hasPreviousPage: boolean }
  fetchPrevious: () => Promise<PaginatedConnection<T>>
}

export type LabelWithChildren = {
  id: string
  isGroup: boolean
  children: () => Promise<PaginatedConnection<LabelWithChildren>>
}

export async function flattenAssignableLabels<T extends LabelWithChildren>(
  labels: T[],
): Promise<T[]> {
  const assignable: T[] = []
  const seen = new Set<string>()

  async function walk(items: T[]): Promise<void> {
    const groups: T[] = []

    for (const label of items) {
      if (seen.has(label.id)) {
        continue
      }
      seen.add(label.id)

      if (label.isGroup) {
        groups.push(label)
      } else {
        assignable.push(label)
      }
    }

    if (groups.length === 0) {
      return
    }

    const childLists = await Promise.all(
      groups.map(async (group) => {
        const connection = await group.children()
        return fetchAllPreviousPages(connection)
      }),
    )

    await Promise.all(childLists.map((children) => walk(children as T[])))
  }

  await walk(labels)
  return assignable
}

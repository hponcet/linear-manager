import { Issue, IssueHistory, IssueHistoryConnection, PaginationOrderBy, User } from "@linear/sdk"
import { useMemo, useState } from "react"

import { useAsyncEffect } from "./useAsyncEffect"

import { orderHistory } from "../utils/history"

type UseIssueHistoryParams = {
  issue: Issue | null
  users: User[] | null
  historyRefetch?: number
}

export function useIssueHistory(params: UseIssueHistoryParams) {
  const { issue, users, historyRefetch } = params

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [history, setHistory] = useState<Record<string, IssueHistory>>({})

  function updateHistory(res: IssueHistoryConnection) {
    const { nodes } = res

    setHistory((prev) => {
      const newHistory = { ...prev }
      nodes.forEach((h) => {
        newHistory[h.id] = h
      })
      return newHistory
    })
  }

  useAsyncEffect(async () => {
    if (!issue) return

    const res = await issue.history({
      first: 50,
    })
    updateHistory(res)

    // Impossible to call history by last to first, pagination does not work properly
    // so we need to fetch all pages until the end and then order them in the UI
    let fetchedEndCursor = res.pageInfo.endCursor || null
    while (fetchedEndCursor) {
      const moreRes = await issue.history({
        before: fetchedEndCursor,
        last: 50,
        orderBy: PaginationOrderBy.CreatedAt,
      })
      updateHistory(moreRes)
      fetchedEndCursor = moreRes.pageInfo.endCursor || null
    }

    setIsLoading(false)
  }, [issue, historyRefetch])

  const orderedHistory = useMemo(() => {
    if (!users) return []
    const ordered = orderHistory(Object.values(history), users)
    return ordered
  }, [history, users])

  return [orderedHistory, isLoading] as const
}

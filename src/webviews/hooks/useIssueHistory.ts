import { useMemo, useState } from "react"
import { IssueHistoryPage, IssueHistoryRequest } from "src/linear/LinearService"
import { SerializedIssueHistory, SerializedUser } from "src/types/SerializedLinear"

import { useAsyncEffect } from "./useAsyncEffect"

import { orderHistory } from "../utils/history"

type UseIssueHistoryParams = {
  issueId: string | undefined
  getIssueHistory: (request: IssueHistoryRequest) => Promise<IssueHistoryPage>
  users: SerializedUser[] | null
  historyRefetch?: number
}

export function useIssueHistory(params: UseIssueHistoryParams) {
  const { issueId, getIssueHistory, users, historyRefetch } = params

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [history, setHistory] = useState<Record<string, SerializedIssueHistory>>({})

  function updateHistory(nodes: SerializedIssueHistory[]) {
    setHistory((prev) => {
      const newHistory = { ...prev }
      nodes.forEach((h) => {
        newHistory[h.id] = h
      })
      return newHistory
    })
  }

  useAsyncEffect(async () => {
    if (!issueId) {
      return
    }

    setIsLoading(true)
    setHistory({})

    const res = await getIssueHistory({ issueId })
    updateHistory(res.nodes)

    setIsLoading(false)
  }, [issueId, historyRefetch])

  const orderedHistory = useMemo(() => {
    return orderHistory(Object.values(history), users ?? [])
  }, [history, users])

  return [orderedHistory, isLoading] as const
}

import { useCallback, useEffect, useState } from "react"
import { PullRequestStatus } from "src/gitProviders/types"

import { vscApi } from "./useRequestDataUpdate"

type UsePullRequestParams = {
  sourceBranch?: string
  enabled?: boolean
}

export function usePullRequest(params: UsePullRequestParams) {
  const { sourceBranch, enabled = true } = params
  const [status, setStatus] = useState<PullRequestStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (!enabled || !sourceBranch) {
      setStatus(null)
      return
    }

    setLoading(true)
    try {
      const nextStatus = await vscApi.postMessage({
        type: "getPullRequestStatus",
        sourceBranch,
      })
      setStatus(nextStatus)
    } finally {
      setLoading(false)
    }
  }, [enabled, sourceBranch])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const openPullRequest = useCallback(async (issueId: string, branch: string) => {
    return vscApi.postMessage({
      type: "openPullRequest",
      issueId,
      sourceBranch: branch,
    })
  }, [])

  return {
    status,
    loading,
    refreshStatus,
    openPullRequest,
  }
}

import { Issue } from "@linear/sdk"
import { useEffect, useState } from "react"
import { GlobalListenerMessage } from "src/types/ActionMessage"
import { Ref } from "src/types/GitAPI"

import { useAsyncEffect } from "./useAsyncEffect"
import { useIssueSettings } from "./useIssueSettings"
import { useRequestDataUpdate } from "./useRequestDataUpdate"

type UseIssueBranchesParams = {
  issueId: Issue["id"]
}

export function useIssueBranches(params: UseIssueBranchesParams) {
  const { issueId } = params

  const {
    getAllBranches,
    getCurrentBranch,
    checkout,
    getGitStatus,
    startWork,
    hasUncommittedChanges: checkHasUncommittedChanges,
  } = useRequestDataUpdate()

  const [gitApiInitialized, setGitApiInitialized] = useState<boolean>(false)
  const [repoInitialized, setRepoInitialized] = useState<boolean>(false)
  const [fetchingBranches, setFetchingBranches] = useState(true)
  const [branches, setBranches] = useState<Ref[]>([])
  const [currentBranch, setCurrentBranch] = useState<Ref | null>(null)
  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(false)

  async function fetchBranches() {
    try {
      setBranches(await getAllBranches())
    } catch (error) {
      console.error("Failed to fetch branches", error)
    }
  }

  async function fetchCurrentBranch() {
    try {
      setCurrentBranch(await getCurrentBranch())
    } catch (error) {
      console.error("Failed to fetch current branch", error)
    }
  }

  useAsyncEffect(async () => {
    await fetchBranches()
    await fetchCurrentBranch()
    setFetchingBranches(false)
  }, [])

  useAsyncEffect(async () => {
    while (true) {
      setHasUncommittedChanges(await checkHasUncommittedChanges())
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }, [])

  useEffect(() => {
    function handleGlobalMessages(e: MessageEvent<GlobalListenerMessage>) {
      const msg = e.data
      if (msg.action === "gitActive") {
        setRepoInitialized(!!msg.payload.repoActive)
        setGitApiInitialized(!!msg.payload.apiActive)
      }
    }

    getGitStatus().then((status) => {
      setRepoInitialized(!!status.repoActive)
      setGitApiInitialized(!!status.apiActive)
    })

    window.addEventListener("message", handleGlobalMessages)
    return () => {
      window.removeEventListener("message", handleGlobalMessages)
    }
  }, [])

  const { issueSettings, updateIssueSettings, issueSettingsAreLoading } = useIssueSettings({
    issueId,
  })

  async function checkoutBranch() {
    try {
      if (issueSettings.branch) {
        await checkout(issueSettings.branch)
        await fetchCurrentBranch()
      }
    } catch (error) {
      console.error("Failed to checkout branch", error)
      await startWork(issueId)
    }
  }

  return {
    repoInitialized,
    gitApiInitialized,
    issueSettings,
    isLoading: issueSettingsAreLoading || fetchingBranches,
    branches,
    currentBranch,
    issueBranch: issueSettings.branch,
    hasUncommittedChanges,
    updateIssueSettings,
    fetchBranches,
    fetchCurrentBranch,
    checkoutBranch,
  }
}

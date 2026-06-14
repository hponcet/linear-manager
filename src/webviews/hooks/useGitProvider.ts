import { useCallback, useEffect, useState } from "react"
import {
  BitbucketAuthMethod,
  GitProviderId,
  GitProviderOAuthSetup,
  GitProviderStatus,
} from "src/gitProviders/types"

import { vscApi } from "./useRequestDataUpdate"

export function useGitProvider(selectedProvider?: GitProviderId) {
  const [status, setStatus] = useState<GitProviderStatus | null>(null)
  const [oauthSetup, setOauthSetup] = useState<GitProviderOAuthSetup | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const refreshStatus = useCallback(async () => {
    setLoading(true)
    try {
      const nextStatus = await vscApi.postMessage({ type: "getGitProviderStatus" })
      setStatus(nextStatus)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshOAuthSetup = useCallback(
    async (provider: GitProviderId, bitbucketAuthMethod?: BitbucketAuthMethod) => {
      const setup = await vscApi.postMessage({
        type: "getGitProviderOAuthSetup",
        provider,
        bitbucketAuthMethod,
      })
      setOauthSetup(setup)
    },
    [],
  )

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    if (!selectedProvider) {
      setOauthSetup(null)
      return
    }
    void refreshOAuthSetup(selectedProvider)
  }, [selectedProvider, refreshOAuthSetup])

  const connect = useCallback(
    async (credentials?: { bitbucketApiToken?: string; bitbucketOAuthClientSecret?: string }) => {
      setConnecting(true)
      try {
        const nextStatus = await vscApi.postMessage({
          type: "connectGitProvider",
          bitbucketApiToken: credentials?.bitbucketApiToken,
          bitbucketOAuthClientSecret: credentials?.bitbucketOAuthClientSecret,
        })
        setStatus(nextStatus)
        return nextStatus
      } finally {
        setConnecting(false)
      }
    },
    [],
  )

  const disconnect = useCallback(async () => {
    setConnecting(true)
    try {
      const nextStatus = await vscApi.postMessage({ type: "disconnectGitProvider" })
      setStatus(nextStatus)
      return nextStatus
    } finally {
      setConnecting(false)
    }
  }, [])

  return {
    status,
    oauthSetup,
    loading,
    connecting,
    refreshStatus,
    refreshOAuthSetup,
    connect,
    disconnect,
  }
}

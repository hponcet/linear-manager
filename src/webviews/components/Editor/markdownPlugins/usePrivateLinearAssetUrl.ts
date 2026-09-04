import { useCallback, useEffect, useState } from "react"
import { vscApi } from "src/webviews/hooks/useRequestDataUpdate"

import { getCanonicalPrivateLinearAssetUrl } from "./privateLinearImageUrl"

type PrivateAssetState =
  | { status: "loading"; url: string }
  | { status: "ready"; url: string; objectUrl: string; mimeType: string }
  | { status: "error"; url: string }

export function usePrivateLinearAssetUrl(source: string) {
  const privateUrl = getCanonicalPrivateLinearAssetUrl(source)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<PrivateAssetState>({ status: "loading", url: "" })

  useEffect(() => {
    if (!privateUrl) return

    let objectUrl: string | undefined
    let active = true
    setState({ status: "loading", url: privateUrl })

    void vscApi
      .postMessage({ type: "downloadLinearAsset", url: privateUrl }, { silentError: true })
      .then(({ base64, mimeType }) => {
        if (!active) return
        const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))
        const blob = new Blob([bytes], { type: mimeType })
        objectUrl = URL.createObjectURL(blob)
        setState({ status: "ready", url: privateUrl, objectUrl, mimeType })
      })
      .catch(() => {
        if (active) {
          setState({ status: "error", url: privateUrl })
        }
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attempt, privateUrl])

  const currentState = privateUrl && state.url === privateUrl ? state : undefined
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  return {
    isPrivate: Boolean(privateUrl),
    status: privateUrl ? (currentState?.status ?? "loading") : "ready",
    url:
      privateUrl && currentState?.status === "ready"
        ? currentState.objectUrl
        : privateUrl
          ? ""
          : source,
    mimeType: currentState?.status === "ready" ? currentState.mimeType : null,
    retry,
  } as const
}

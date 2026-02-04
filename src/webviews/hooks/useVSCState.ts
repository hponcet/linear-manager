import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { GlobalListenerMessage } from "src/types/ActionMessage"
import { VscStateKeys } from "src/vscStates"

import { vscApi } from "./useRequestDataUpdate"

export function useVSCState<T>(
  key: VscStateKeys,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  const timestamp = useRef(0)

  useEffect(() => {
    vscApi
      .postMessage({ type: "getState", key })
      .then((data) => {
        if (data.key === key) {
          setState(data?.value || defaultValue)
        }
      })
      .finally(() => setIsLoading(false))
  }, [key])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<GlobalListenerMessage>) => {
      const { action, payload } = event.data

      if (
        action === "stateUpdate" &&
        payload.key === key &&
        payload.timestamp > timestamp.current
      ) {
        setState(payload.value || defaultValue)
        timestamp.current = payload.timestamp
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [key])

  const updateState = (value: SetStateAction<T>) => {
    timestamp.current = Date.now()
    setState((oldState) => {
      const newValue = (value instanceof Function ? value(oldState) : value) || defaultValue

      vscApi.postMessage({
        type: "setState",
        key,
        value: newValue,
        timestamp: timestamp.current,
      })
      return newValue
    })
  }

  return [state, updateState, isLoading]
}

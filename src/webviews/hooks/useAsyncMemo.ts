import { useState } from "react"

import { useAsyncEffect } from "./useAsyncEffect"

export function useAsyncMemo<T>(
  asyncFunction: (currentValue: T | null) => Promise<T>,
  dependencies: React.DependencyList,
): [T | null, boolean] {
  const [value, setValue] = useState<T | null>(null)
  const [isLoading, setLoading] = useState<boolean>(true)

  useAsyncEffect(async () => {
    let isMounted = true

    setLoading(true)
    try {
      const result = await asyncFunction(value)
      if (isMounted) {
        setValue(result)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, dependencies)

  return [value, isLoading]
}

import { useEffect, useState } from "react"
import { Props } from "src/types/ActionMessage"

import { vscApi } from "./useRequestDataUpdate"

export function useProps<k extends keyof Props>(defaults?: Partial<Props[k]>): [Props[k], boolean] {
  const [loaded, setLoaded] = useState(false)

  const [props, setProps] = useState<Props[k]>((defaults as Props[k]) || ({} as Props[k]))

  useEffect(() => {
    vscApi.postMessage({ type: "props" }).then((props) => {
      setProps(props)
      setLoaded(true)
    })
  }, [])

  return [props, loaded]
}

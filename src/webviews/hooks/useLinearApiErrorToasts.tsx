import { useEffect } from "react"
import { Message, useToaster } from "rsuite"

import { getLinearApiErrorMessage, registerLinearApiErrorHandler } from "../api/linearApiErrors"

export function useLinearApiErrorToasts() {
  const toaster = useToaster()

  useEffect(() => {
    registerLinearApiErrorHandler((error, context) => {
      toaster.push(
        <Message showIcon type="error" closable>
          {getLinearApiErrorMessage(error, context)}
        </Message>,
        { placement: "topEnd", duration: 8000 },
      )
    })

    return () => {
      registerLinearApiErrorHandler(null)
    }
  }, [toaster])
}

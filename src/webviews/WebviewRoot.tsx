import { ReactNode } from "react"
import { CustomProvider } from "rsuite"

import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary"
import { LinearApiErrorToasts } from "./components/LinearApiErrorToasts/LinearApiErrorToasts"
import { useRsuiteTheme } from "./hooks/useVsCodeTheme"

type WebviewRootProps = {
  children: ReactNode
}

export function WebviewRoot({ children }: WebviewRootProps) {
  const rsuiteTheme = useRsuiteTheme()

  return (
    <CustomProvider theme={rsuiteTheme}>
      <LinearApiErrorToasts />
      <ErrorBoundary>{children}</ErrorBoundary>
    </CustomProvider>
  )
}

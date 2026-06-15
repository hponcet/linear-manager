import moment from "moment"
import { ReactNode } from "react"
import * as ReactDOM from "react-dom/client"
import { CustomProvider } from "rsuite"

import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary"
import { LinearApiErrorToasts } from "./components/LinearApiErrorToasts/LinearApiErrorToasts"

import "./styles/index.scss"

moment.locale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ",
    s: "%ds ago",
    m: "%dmin ago",
    mm: "%dmin ago",
    h: "%dh ago",
    hh: "%dh ago",
    d: "%dd ago",
    dd: "%dd ago",
    M: "%dmo ago",
    MM: "%dmo ago",
    y: "%dy ago",
    yy: "%dy ago",
  },
})

export function mountWebview(content: ReactNode): void {
  const root = document.getElementById("root")
  if (!root) {
    throw new Error("Webview root element was not found.")
  }

  const reactRoot = ReactDOM.createRoot(root)
  reactRoot.render(
    <CustomProvider theme="dark">
      <LinearApiErrorToasts />
      <ErrorBoundary>{content}</ErrorBoundary>
    </CustomProvider>,
  )
}

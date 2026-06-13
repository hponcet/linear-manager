import moment from "moment"
import * as ReactDOM from "react-dom/client"
import { CustomProvider } from "rsuite"

import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary"
import { LinearApiErrorToasts } from "./components/LinearApiErrorToasts/LinearApiErrorToasts"
import IssueWebview from "./views/IssueWebview/IssueWebview"
import { StartWorkWebview } from "./views/StartWorkWebview/StartWorkWebview"

import { Webviews } from "../constants"

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

import "./styles/index.scss"

const view = document.getElementById("webview") as HTMLElement
const root = document.getElementById("root") as HTMLElement
const reactRoot = ReactDOM.createRoot(root)

function getViewContent() {
  switch (view.getAttribute("content")) {
    case Webviews.issueWebview:
      return <IssueWebview />
    case Webviews.startWorkWebview:
      return <StartWorkWebview />
    default:
      throw new Error("Unknown webview content")
  }
}

reactRoot.render(
  <CustomProvider theme="dark">
    <LinearApiErrorToasts />
    <ErrorBoundary>{getViewContent()}</ErrorBoundary>
  </CustomProvider>,
)

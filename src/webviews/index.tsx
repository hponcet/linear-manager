import * as ReactDOM from "react-dom/client";
import moment from "moment";
import { CustomProvider } from "rsuite";

import { Webviews } from "../constants";
import IssueWebview from "./views/IssueWebview/IssueWebview";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";

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
});

import "./styles/index.scss";

const view = document.getElementById("webview") as HTMLElement;
const root = document.getElementById("root") as HTMLElement;
const reactRoot = ReactDOM.createRoot(root);

function getViewContent() {
  switch (view.getAttribute("content")) {
    case Webviews.issueWebview:
      return <IssueWebview />;
    default:
      throw new Error("Unknown webview content");
  }
}

reactRoot.render(
  <CustomProvider theme="dark">
    <ErrorBoundary>{getViewContent()}</ErrorBoundary>
  </CustomProvider>
);

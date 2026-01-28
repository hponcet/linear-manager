export const IS_PRODUCTION = process.env.NODE_ENV !== "development";

export enum Views {
  myIssues = "linearManager.views.myIssues",
}

export enum Webviews {
  issueWebview = "issue",
  startWorkWebview = "startWork",
}

export enum Commands {
  connect = "linearManager.connect",
  openIssue = "linearManager.commands.openIssue",
  startWork = "linearManager.commands.startWork",
  checkoutIssue = "linearManager.commands.checkoutIssue",
}

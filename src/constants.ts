export const IS_PRODUCTION = process.env.NODE_ENV !== "development"

export enum Views {
  myIssues = "linearManager.views.myIssues",
  pullRequests = "linearManager.views.pullRequests",
}

export enum Webviews {
  issueWebview = "issue",
  startWorkWebview = "startWork",
  settingsWebview = "settings",
}

export enum Commands {
  connect = "linearManager.connect",
  disconnect = "linearManager.disconnect",
  openIssue = "linearManager.commands.openIssue",
  openIssueExternal = "linearManager.commands.openIssueExternal",
  openCurrentBranchIssue = "linearManager.commands.openCurrentBranchIssue",
  startWork = "linearManager.commands.startWork",
  configureBranch = "linearManager.commands.configureBranch",
  checkoutIssue = "linearManager.commands.checkoutIssue",
  refresh = "linearManager.commands.refresh",
  toggleViewMode = "linearManager.commands.toggleViewMode",
  openPullRequest = "linearManager.commands.openPullRequest",
  openSettings = "linearManager.commands.openSettings",
  refreshPullRequests = "linearManager.commands.refreshPullRequests",
  openPullRequestDiff = "linearManager.commands.openPullRequestDiff",
  openPullRequestLinkedIssue = "linearManager.commands.openPullRequestLinkedIssue",
  openPullRequestUrl = "linearManager.commands.openPullRequestUrl",
  checkoutPullRequestBranch = "linearManager.commands.checkoutPullRequestBranch",
}

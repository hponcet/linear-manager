import { ExtensionContext } from "vscode"

import { CommandContext, setCommandContext } from "./commandsContext"
import { GitClient } from "./git/GitClient"
import { GitProviderService } from "./gitProviders/GitProviderService"
import { getLinearClient } from "./linear/auth"
import { LinearService } from "./linear/LinearService"
import { Resources } from "./resources"
import { MyIssuesView } from "./views/myIssues"
import { PullRequestsView } from "./views/pullRequests"

export class Controller {
  static resources: Resources
  static git = new GitClient(this.onGitStatusChange.bind(this))
  static linearService: LinearService
  static gitProviderService: GitProviderService

  static async initialize(context: ExtensionContext) {
    await this.git.init()

    this.gitProviderService = new GitProviderService(context, this.git)
    await this.gitProviderService.initialize()

    this.resources = new Resources(context)
    this.linearService = new LinearService(getLinearClient)
    this._issueViewer = new MyIssuesView(context)
    await this._issueViewer.initialize(context)

    this._pullRequestsView = new PullRequestsView()
    await this._pullRequestsView.initialize(context)
  }

  static onGitStatusChange(gitStatus: { repoActive: boolean; apiActive: boolean }) {
    setCommandContext(CommandContext.gitExtensionLoaded, gitStatus.repoActive)
    this._issueViewer?.changeGitStatus(gitStatus)
    this._pullRequestsView?.changeGitStatus()
  }

  private static _issueViewer: MyIssuesView
  private static _pullRequestsView: PullRequestsView

  public static get issueViewer() {
    return this._issueViewer
  }

  public static dispose() {
    this._issueViewer?.dispose()
    this._pullRequestsView?.dispose()
    this.linearService?.invalidateAll()
    this.git.dispose()
  }
}

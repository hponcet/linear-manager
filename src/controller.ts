import { ExtensionContext } from "vscode"

import { CommandContext, setCommandContext } from "./commandsContext"
import { isExtensionSession } from "./extensionSession"
import { GitClient } from "./git/GitClient"
import { GitProviderService } from "./gitProviders/GitProviderService"
import { getLinearClient } from "./linear/auth"
import { LinearService } from "./linear/LinearService"
import { notifyLinearMcpDefinitionsChanged } from "./mcp/registerLinearMcpServer"
import { Resources } from "./resources"
import { MyIssuesView } from "./views/myIssues"
import { PullRequestsView } from "./views/pullRequests"

export class Controller {
  static resources: Resources
  static git = new GitClient(this.onGitStatusChange.bind(this))
  static linearService: LinearService
  static gitProviderService: GitProviderService

  static async initialize(context: ExtensionContext, sessionId?: number) {
    if (sessionId !== undefined && !isExtensionSession(sessionId)) {
      return
    }

    this.dispose()

    if (sessionId !== undefined && !isExtensionSession(sessionId)) {
      return
    }

    await this.git.init()

    this.gitProviderService = new GitProviderService(context, this.git)
    await this.gitProviderService.initialize()

    if (sessionId !== undefined && !isExtensionSession(sessionId)) {
      this.dispose()
      return
    }

    this.resources = new Resources(context)
    this.linearService = new LinearService(getLinearClient)

    this._issueViewer = new MyIssuesView(context)
    await this._issueViewer.initialize()

    if (sessionId !== undefined && !isExtensionSession(sessionId)) {
      this.dispose()
      return
    }

    this._pullRequestsView = new PullRequestsView()
    await this._pullRequestsView.initialize(context)
  }

  static onGitStatusChange(gitStatus: { repoActive: boolean; apiActive: boolean }) {
    setCommandContext(CommandContext.gitExtensionLoaded, gitStatus.apiActive)
    this._issueViewer?.changeGitStatus(gitStatus)
    this._pullRequestsView?.changeGitStatus()
    notifyLinearMcpDefinitionsChanged()
  }

  private static _issueViewer: MyIssuesView | undefined
  private static _pullRequestsView: PullRequestsView | undefined

  public static get issueViewer(): MyIssuesView {
    if (!this._issueViewer) {
      throw new Error("Linear Manager is not initialized.")
    }

    return this._issueViewer
  }

  public static dispose() {
    this._issueViewer?.dispose()
    this._pullRequestsView?.dispose()
    this._issueViewer = undefined
    this._pullRequestsView = undefined
    this.linearService?.invalidateAll()
    this.git.dispose()
  }
}

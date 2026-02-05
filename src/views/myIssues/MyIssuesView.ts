import { LinearClient, User } from "@linear/sdk"
import { Commands, Views } from "src/constants"
import { Controller } from "src/controller"
import { getLinearClient } from "src/linear/auth"
import { filterWorkflowStatesByType } from "src/panels/commons/worflowStates"
import { IssueWebview } from "src/panels/IssueWebview"
import { StartWorkWebview } from "src/panels/StartWorkWebview"
import { WorkflowStateWithStateProgress } from "src/types/Linear"
import { Stores } from "src/utils/Stores"
import {
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window,
  EventEmitter,
  TreeDragAndDropController,
  DataTransfer,
  ExtensionContext,
  ViewColumn,
  commands,
  Disposable,
  Uri,
} from "vscode"

import {
  fetchMe,
  fetchTeams,
  fetchWorkflowStates,
  fetchIssues,
  fetchCurrentCycleIssues,
} from "./dataFetching"
import {
  registerDropProvider,
  registerLinearIssueContentProvider,
  handleTreeDrag,
} from "./dragAndDrop"
import { createTeamTreeItem, createWorkflowStateTreeItem, createIssueTreeItem } from "./treeItems"
import {
  Team,
  WorkflowState,
  Issue,
  MIME_TYPE_ISSUE,
  AUTO_REFRESH_INTERVAL_MS,
  addKeyOnItem,
  ViewMode,
} from "./types"

export class MyIssuesView
  implements
    TreeDataProvider<Team | WorkflowState | Issue>,
    TreeDragAndDropController<Issue | WorkflowState | Team>
{
  // Drag & Drop configuration
  dropMimeTypes = [MIME_TYPE_ISSUE]
  dragMimeTypes = [MIME_TYPE_ISSUE, "text/uri-list"]

  // Event emitter for tree refresh
  #onDidChangeTreeData = new EventEmitter<void>()
  onDidChangeTreeData = this.#onDidChangeTreeData.event

  // TreeItems cache
  #treeItems = new Map<string, TreeItem>()

  // Context & Linear client
  #context: ExtensionContext
  #linearClient = getLinearClient() as LinearClient
  protected issuesStore: ReturnType<Stores["issuesStore"]>

  // Data state
  #me: User | null = null
  #teams: Record<string, Team> = {}
  #workflowStatesByTeam: Record<string, Record<string, WorkflowState>> = {}
  #myIssues: Map<string, Issue> = new Map()
  #viewMode: ViewMode = "myIssues"

  // Webviews
  #issuesWebviews: Map<string, IssueWebview> = new Map()
  #startWorkWebviews: Map<string, StartWorkWebview> = new Map()

  // Auto-refresh
  #autoRefreshInterval: NodeJS.Timeout | null = null

  // Disposables
  #disposables: Disposable[] = []

  // TreeView reference
  #treeView: ReturnType<typeof window.createTreeView<Team | WorkflowState | Issue>> | null = null

  constructor(context: ExtensionContext) {
    this.#context = context
    this.issuesStore = new Stores(context).issuesStore()
  }

  // ============================================================
  // Initialization
  // ============================================================

  public async initialize(context: ExtensionContext): Promise<void> {
    await this.fetchDatas()
    this._startAutoRefresh()

    // Create TreeView
    this.#treeView = window.createTreeView(Views.myIssues, {
      treeDataProvider: this,
      dragAndDropController: this,
      showCollapseAll: true,
      canSelectMany: true,
    })
    context.subscriptions.push(this.#treeView)

    // Register drag & drop providers
    const dragDropHandlers = {
      openIssue: this.openIssue.bind(this),
      getIssue: (issueId: string) => this.#myIssues.get(issueId),
    }

    const dropProvider = registerDropProvider(context, dragDropHandlers)
    registerLinearIssueContentProvider(context, dragDropHandlers)

    // Register commands
    const disposableCommands = [
      commands.registerCommand(Commands.openIssue, (issue: Issue) => this.openIssue(issue)),
      commands.registerCommand(
        Commands.openIssueExternal,
        async (issueIdentifier: Issue["identifier"] | Issue) =>
          await this.openIssueExternal(issueIdentifier),
      ),
      commands.registerCommand(Commands.openCurrentBranchIssue, () =>
        this.openCurrentBranchIssue(),
      ),
      commands.registerCommand(Commands.startWork, (issue: Issue) => this.startWork(issue)),
      commands.registerCommand(Commands.configureBranch, (issue: Issue) => this.startWork(issue)),
      commands.registerCommand(Commands.checkoutIssue, (issue: Issue) =>
        this.checkoutToIssueBranch(issue.id),
      ),
      commands.registerCommand(Commands.refresh, () => this.fetchDatas()),
      commands.registerCommand(Commands.toggleViewMode, () => this.toggleViewMode()),
      dropProvider,
    ]

    context.subscriptions.push(...disposableCommands)
    this.#disposables.push(...disposableCommands)
  }

  // ============================================================
  // Data Fetching
  // ============================================================

  public async fetchDatas() {
    this.#me = await fetchMe(this.#linearClient, this.#me)
    this.#teams = await fetchTeams(this.#linearClient, this.#me)
    this.#workflowStatesByTeam = await fetchWorkflowStates(this.#linearClient, this.#teams)
    await this._refreshIssues()
  }

  private async _refreshIssues() {
    let issues: Issue[]

    if (this.#viewMode === "myIssues") {
      issues = await fetchIssues(this.#me)
    } else {
      issues = await fetchCurrentCycleIssues(this.#linearClient, this.#teams)
    }

    // Clear previous issues and add new ones
    this.#myIssues.clear()
    issues.forEach((issue) => {
      this._updateWebviewsIfNeeded(issue)
      this.#myIssues.set(issue.id, issue)
    })

    this.#onDidChangeTreeData.fire()
  }

  /**
   * Toggle between "My Issues" and "Current Cycle" view modes
   */
  public async toggleViewMode() {
    this.#viewMode = this.#viewMode === "myIssues" ? "currentCycle" : "myIssues"

    // Update TreeView title
    if (this.#treeView) {
      this.#treeView.title = this.#viewMode === "myIssues" ? "My Issues" : "Current Cycle"
    }

    // Update context for conditional button icon/title
    commands.executeCommand("setContext", "linearManager:viewMode", this.#viewMode)

    await this._refreshIssues()
  }

  private _updateWebviewsIfNeeded(issue: Issue) {
    const issuePanel = this.#issuesWebviews.get(issue.id)
    const webviewPanel = this.#startWorkWebviews.get(issue.id)

    if (
      issuePanel?.visible &&
      issuePanel?.issue?.updatedAt &&
      issuePanel.issue.updatedAt.getTime() !== issue.updatedAt.getTime()
    ) {
      issuePanel?.updateWebview(issue)
    }

    if (
      webviewPanel?.visible &&
      webviewPanel?.issue?.updatedAt &&
      webviewPanel.issue.updatedAt.getTime() !== issue.updatedAt.getTime()
    ) {
      webviewPanel?.updateWebview(issue)
    }
  }

  private _startAutoRefresh() {
    if (this.#autoRefreshInterval) {
      return
    }
    this.#autoRefreshInterval = setInterval(() => this._refreshIssues(), AUTO_REFRESH_INTERVAL_MS)
  }

  // ============================================================
  // Issue Actions
  // ============================================================

  public async openIssue(issue: Issue, viewColumn?: ViewColumn) {
    let webview = this.#issuesWebviews.get(issue.id)
    if (!webview) {
      webview = new IssueWebview(this.#context, this.issuesActions)
      this.#issuesWebviews.set(issue.id, webview)
    }
    await webview.open(issue, viewColumn ?? ViewColumn.Active)
  }

  public async openIssueExternal(issueIdentifier: Issue["identifier"] | Issue) {
    const identifier =
      typeof issueIdentifier === "string" ? issueIdentifier : issueIdentifier.identifier

    const organisation = await this.#me?.organization
    if (organisation?.urlKey) {
      const url = `https://linear.app/${organisation.urlKey}/issue/${identifier}`
      await commands.executeCommand("vscode.open", Uri.parse(url))
    }
  }

  /**
   * Opens the issue associated with the current Git branch
   */
  public async openCurrentBranchIssue() {
    const currentBranch = Controller.git.getCurrentBranch()

    if (!currentBranch?.name) {
      window.showWarningMessage("No current branch found")
      return
    }

    // Find the issue that matches the current branch
    const allIssueStates = this.issuesStore.getAll()

    for (const [issueId, issueState] of Object.entries(allIssueStates)) {
      if (issueState.branchInitialized && issueState.branch?.name === currentBranch.name) {
        // Found the issue, try to get it from cache or fetch it
        let issue = this.#myIssues.get(issueId)

        if (!issue) {
          try {
            const fetchedIssue = await this.#linearClient.issue(issueId)
            issue = addKeyOnItem(fetchedIssue, "issue")
          } catch {
            window.showErrorMessage("Failed to fetch issue from Linear")
            return
          }
        }

        await this.openIssue(issue)
        return
      }
    }

    window.showInformationMessage(`No Linear issue found for branch "${currentBranch.name}"`)
  }

  public async startWork(issue: Issue, fromCheckout?: true) {
    let webview = this.#startWorkWebviews.get(issue.id)
    if (!webview) {
      webview = new StartWorkWebview(this.#context, this.issuesActions, fromCheckout)
      this.#startWorkWebviews.set(issue.id, webview)
    }
    await webview.open(issue, ViewColumn.Active)
  }

  public async checkoutToIssueBranch(issueId: Issue["id"]) {
    const issueState = this.issuesStore.get(issueId)

    if (issueState.branchInitialized && issueState.branch) {
      Controller.git.checkout(issueState.branch)
      return
    }

    const issue =
      this.#myIssues.get(issueId) || addKeyOnItem(await this.#linearClient.issue(issueId), "issue")

    if (!issue) return

    this.startWork(issue, true)
  }

  public changeGitStatus(gitStatus: { repoActive: boolean; apiActive: boolean }) {
    this.#issuesWebviews
      .values()
      .forEach((webview) => webview.postListenerMessage("gitActive", gitStatus))
    this.#startWorkWebviews
      .values()
      .forEach((webview) => webview.postListenerMessage("gitActive", gitStatus))
  }

  public refresh(): void {
    this.fetchDatas()
  }

  // Actions exposed to webviews
  issuesActions = {
    openIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return

      const issue = this.#myIssues.get(issueId)
      if (issue) {
        await this.openIssue(issue)
      } else {
        const fetchedIssue = await this.#linearClient.issue(issueId)
        const issueWithKey = addKeyOnItem(fetchedIssue, "issue")
        this.#myIssues.set(issueWithKey.id, issueWithKey)
        await this.openIssue(issueWithKey)
      }
    },
    openIssueExternal: this.openIssueExternal.bind(this),
    updateIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return

      if (this.#myIssues.has(issueId)) {
        const issue = await this.#linearClient.issue(issueId)
        this.#myIssues.set(issue.id, addKeyOnItem(issue, "issue"))
        this.#onDidChangeTreeData.fire()
      }
    },
    startWork: async (issueId: Issue["id"]) => {
      if (!issueId) return

      const issue = this.#myIssues.get(issueId)
      if (issue) {
        await this.startWork(issue)
      } else {
        const fetchedIssue = await this.#linearClient.issue(issueId)
        const issueWithKey = addKeyOnItem(fetchedIssue, "issue")
        this.#myIssues.set(issueWithKey.id, issueWithKey)
        await this.startWork(issueWithKey)
      }
    },
  }

  // ============================================================
  // TreeDataProvider Implementation
  // ============================================================

  public getChildren(
    element?: Team | WorkflowState | Issue | undefined,
  ): ProviderResult<Team[] | WorkflowState[] | Issue[]> {
    if (element?.__key === "team") {
      return this._getWorkflowStatesForTeam(element.id)
    }

    if (element?.__key === "workflowState") {
      return this._getIssuesForState(element.id)
    }

    if (!element) {
      return this._getRootElements()
    }

    return []
  }

  public getTreeItem(element: Team | WorkflowState | Issue): TreeItem {
    let item: TreeItem

    if (element.__key === "team") {
      item = createTeamTreeItem(element)
    } else if (element.__key === "workflowState") {
      const issuesCount = this._getIssuesCountForState(element.id)
      item = createWorkflowStateTreeItem(
        element as unknown as WorkflowStateWithStateProgress,
        issuesCount,
      )
    } else {
      const issueState = this.issuesStore.get(element.id)
      const branchName = issueState?.branchInitialized ? issueState.branch?.name : undefined
      item = createIssueTreeItem(element, branchName)
    }

    this.#treeItems.set(item.id!, item)
    return item
  }

  private _getRootElements(): Team[] | WorkflowState[] | null {
    const teams = Object.values(this.#teams).filter((team) =>
      Array.from(this.#myIssues.values()).some(
        // @ts-expect-error
        (issue) => issue._team.id === team.id,
      ),
    )

    if (teams.length === 0) {
      return null
    }
    if (teams.length === 1) {
      return this._getWorkflowStatesForTeam(teams[0].id)
    }

    return teams
  }

  private _getWorkflowStatesForTeam(teamId: Team["id"]): WorkflowState[] {
    return filterWorkflowStatesByType(
      Object.values(this.#workflowStatesByTeam[teamId]),
    ) as unknown as WorkflowState[]
  }

  private _getIssuesForState(stateId: WorkflowState["id"]): Issue[] {
    return Array.from(this.#myIssues.values()).filter(
      // @ts-expect-error
      (issue) => issue._state.id === stateId,
    )
  }

  private _getIssuesCountForState(stateId: WorkflowState["id"]): number {
    return this._getIssuesForState(stateId).length
  }

  // ============================================================
  // TreeDragAndDropController Implementation
  // ============================================================

  public async handleDrag(
    source: (Issue | WorkflowState | Team)[],
    treeDataTransfer: DataTransfer,
  ): Promise<void> {
    handleTreeDrag(source, treeDataTransfer)
  }

  public async handleDrop(
    target: Team | WorkflowState | Issue | undefined,
    sources: DataTransfer,
  ): Promise<void> {
    const issues: Issue[] = []

    sources.forEach((value, key) => {
      if (key.toLocaleLowerCase().startsWith(MIME_TYPE_ISSUE.toLowerCase())) {
        issues.push(value.value as Issue)
      }
    })

    await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.__key !== "issue") {
          return
        }

        if (!target || !["workflowState", "issue"].includes(target.__key)) {
          return
        }

        const targetStateId =
          // @ts-expect-error
          target.__key === "workflowState" ? target.id : target._state.id

        await this.#linearClient.updateIssue(issue.id, {
          stateId: targetStateId,
        })

        await this._refreshIssues()
      }),
    )
  }

  // ============================================================
  // Dispose
  // ============================================================

  public dispose() {
    if (this.#autoRefreshInterval) {
      clearInterval(this.#autoRefreshInterval)
      this.#autoRefreshInterval = null
    }

    this.#onDidChangeTreeData.dispose()
    this.#disposables.forEach((d) => d.dispose())

    this.#issuesWebviews.forEach((webview) => webview.dispose())
    this.#issuesWebviews.clear()
    this.#startWorkWebviews.forEach((webview) => webview.dispose())
    this.#startWorkWebviews.clear()

    this.#treeItems.clear()
    this.#myIssues.clear()
    this.#workflowStatesByTeam = {}
    this.#teams = {}
    this.#me = null
  }
}

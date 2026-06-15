import { User } from "@linear/sdk"
import { Commands, Views } from "src/constants"
import { Controller } from "src/controller"
import { ensureCursorEnvironment } from "src/cursor/detectCursorEnvironment"
import { launchCursorAgentForIssue } from "src/cursor/launchCursorAgentForIssue"
import { logLinearApiCall } from "src/linear/LinearApiLogger"
import { filterWorkflowStatesByType } from "src/panels/commons/worflowStates"
import { IssueWebview } from "src/panels/IssueWebview"
import { SettingsWebview, SettingsTab } from "src/panels/SettingsWebview"
import { StartWorkWebview } from "src/panels/StartWorkWebview"
import { IssueSyncPayload } from "src/types/IssueSync"
import { WorkflowStateWithStateProgress } from "src/types/Linear"
import { Stores } from "src/utils/Stores"
import {
  buildUserAvatarIconCacheForContext,
  UNASSIGNED_ASSIGNEE_ID,
} from "src/utils/userAvatarIcon"
import { SettingsVscState, VscStateKeys } from "src/vscStates"
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
  workspace,
  TreeItemCollapsibleState,
} from "vscode"

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
  DEFAULT_AUTO_REFRESH_INTERVAL_SECONDS,
  ViewMode,
} from "./types"

import { getDefaultWorkflowStateExpanded, TreeViewExpansionState } from "../treeViewExpansionState"

export class MyIssuesView
  implements
    TreeDataProvider<Team | WorkflowState | Issue>,
    TreeDragAndDropController<Issue | WorkflowState | Team>
{
  dropMimeTypes = [MIME_TYPE_ISSUE]
  dragMimeTypes = [MIME_TYPE_ISSUE, "text/uri-list"]

  #onDidChangeTreeData = new EventEmitter<void>()
  onDidChangeTreeData = this.#onDidChangeTreeData.event

  #treeItems = new Map<string, TreeItem>()

  #context: ExtensionContext
  protected issuesStore: ReturnType<Stores["issuesStore"]>

  #me: User | null = null
  #teams: Record<string, Team> = {}
  #workflowStatesByTeam: Record<string, Record<string, WorkflowState>> = {}
  #myIssues: Map<string, Issue> = new Map()
  #assigneeIconByUserId: Map<string, Uri> = new Map()
  #assigneeByUserId: Map<string, User> = new Map()
  #viewMode: ViewMode = "myIssues"

  #issuesWebviews: Map<string, IssueWebview> = new Map()
  #startWorkWebviews: Map<string, StartWorkWebview> = new Map()
  #settingsWebview: SettingsWebview | undefined

  #autoRefreshInterval: NodeJS.Timeout | null = null
  #windowFocused = true

  #disposables: Disposable[] = []

  #treeView: ReturnType<typeof window.createTreeView<Team | WorkflowState | Issue>> | null = null

  constructor(context: ExtensionContext) {
    this.#context = context
    this.issuesStore = new Stores(context).issuesStore()
  }

  // ============================================================
  // Initialization
  // ============================================================

  public async initialize(): Promise<void> {
    this._startAutoRefresh()

    const focusDisposable = window.onDidChangeWindowState((state) => {
      this.#windowFocused = state.focused
      if (state.focused) {
        this._refreshIssues()
      }
    })
    this.#disposables.push(focusDisposable)

    const configDisposable = workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("linearManager.autoRefreshIntervalSeconds")) {
        this._restartAutoRefresh()
      }
    })
    this.#disposables.push(configDisposable)

    // Create TreeView
    this.#treeView = window.createTreeView(Views.myIssues, {
      treeDataProvider: this,
      dragAndDropController: this,
      showCollapseAll: true,
      canSelectMany: true,
    })
    this.#disposables.push(this.#treeView)
    this.#bindTreeExpansionState()

    // Register drag & drop providers
    const dragDropHandlers = {
      openIssue: this.openIssue.bind(this),
      getIssue: (issueId: string) => this.#myIssues.get(issueId),
    }

    const dropProvider = registerDropProvider(dragDropHandlers)
    const contentProvider = registerLinearIssueContentProvider(dragDropHandlers)

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
      commands.registerCommand(Commands.startWorkWithAgent, (issue: Issue) =>
        this.startWorkWithAgent(issue),
      ),
      commands.registerCommand(Commands.configureBranch, (issue: Issue) => this.startWork(issue)),
      commands.registerCommand(Commands.checkoutIssue, (issue: Issue) =>
        this.checkoutToIssueBranch(issue.id),
      ),
      commands.registerCommand(Commands.refresh, () => this.fetchDatas()),
      commands.registerCommand(Commands.toggleViewMode, () => this.toggleViewMode()),
      commands.registerCommand(Commands.openPullRequest, (issue: Issue) =>
        this.openPullRequestForIssue(issue),
      ),
      commands.registerCommand(Commands.openSettings, (issue: Issue) => this.openSettings(issue)),
      commands.registerCommand(Commands.openSettingsTab, (tab: SettingsTab) =>
        this.openSettingsTab(tab),
      ),
      dropProvider,
      contentProvider,
    ]

    this.#disposables.push(...disposableCommands)

    await this.fetchDatas()
  }

  // ============================================================
  // Data Fetching
  // ============================================================

  public async fetchDatas() {
    const service = Controller.linearService
    this.#me = await service.getViewer()
    this.#teams = await service.getTeams()
    this.#workflowStatesByTeam = await service.getWorkflowStatesByTeam()
    await this._refreshIssues()
  }

  private async _resolveAssigneeUsers(issues: Issue[]): Promise<User[]> {
    const workspaceUsers = await Controller.linearService.getWorkspaceUsers()
    const usersById = new Map(workspaceUsers.map((user) => [user.id, user]))

    if (this.#me?.id) {
      usersById.set(this.#me.id, this.#me)
    }

    const missingAssigneeIds = [
      ...new Set(
        issues
          .map((issue) => issue.assigneeId)
          .filter((assigneeId): assigneeId is string => !!assigneeId && !usersById.has(assigneeId)),
      ),
    ]

    const issueByAssigneeId = new Map<string, Issue>()
    for (const issue of issues) {
      if (issue.assigneeId && !issueByAssigneeId.has(issue.assigneeId)) {
        issueByAssigneeId.set(issue.assigneeId, issue)
      }
    }

    await Promise.all(
      missingAssigneeIds.map(async (assigneeId) => {
        const issue = issueByAssigneeId.get(assigneeId)
        if (!issue) {
          return
        }

        try {
          const assignee = await issue.assignee
          if (assignee) {
            usersById.set(assigneeId, assignee)
          }
        } catch {
          // Fall back to the unassigned icon when assignee details cannot be loaded.
        }
      }),
    )

    return [...usersById.values()]
  }

  private async _refreshAssigneeIcons(issues: Issue[]) {
    const users = await this._resolveAssigneeUsers(issues)
    this.#assigneeByUserId = new Map(users.map((user) => [user.id, user]))
    this.#assigneeIconByUserId = await buildUserAvatarIconCacheForContext(this.#context, users)
  }

  private async _refetchIssue(issueId: Issue["id"]): Promise<Issue | null> {
    try {
      const issue = Controller.linearService.toTreeIssue(
        await Controller.linearService.getIssue(issueId, { bypassCache: true }),
      )
      this.#myIssues.set(issue.id, issue)
      this._updateWebviewsIfNeeded(issue)
      await this._refreshAssigneeIcons(Array.from(this.#myIssues.values()))
      this.#onDidChangeTreeData.fire()
      return issue
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch issue details: ${error instanceof Error ? error.message : String(error)}`,
      )
      return null
    }
  }

  private async _refreshIssues() {
    logLinearApiCall(`MyIssuesView.refreshIssues:${this.#viewMode}`)
    let issues: Issue[]

    if (this.#viewMode === "myIssues") {
      issues = await Controller.linearService.getAssignedIssues()
    } else {
      issues = await Controller.linearService.getCurrentCycleIssues()
    }

    // Clear previous issues and add new ones
    this.#myIssues.clear()
    issues.forEach((issue) => {
      this._updateWebviewsIfNeeded(issue)
      this.#myIssues.set(issue.id, issue)
    })

    await this._refreshAssigneeIcons(issues)
    this.#treeItems.clear()
    this.#onDidChangeTreeData.fire()
  }

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

  #getExpansionStorageKey(): string {
    return `linearManager.myIssuesTreeExpansion.${this.#viewMode}`
  }

  #getExpansionState(): TreeViewExpansionState {
    return new TreeViewExpansionState(this.#context.workspaceState, this.#getExpansionStorageKey())
  }

  #bindTreeExpansionState(): void {
    if (!this.#treeView) {
      return
    }

    this.#disposables.push(
      this.#getExpansionState().bindTreeView(this.#treeView, {
        getElementId: (element) => {
          if (element.__key === "team" || element.__key === "workflowState") {
            return element.id
          }

          return undefined
        },
        getDefaultExpanded: (element) => {
          if (element.__key === "team") {
            return true
          }

          if (element.__key === "workflowState") {
            return getDefaultWorkflowStateExpanded(element.type)
          }

          return false
        },
      }),
    )
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

  private _getAutoRefreshIntervalMs(): number | null {
    const seconds = workspace
      .getConfiguration("linearManager")
      .get<number>("autoRefreshIntervalSeconds", DEFAULT_AUTO_REFRESH_INTERVAL_SECONDS)

    if (seconds <= 0) {
      return null
    }

    return seconds * 1000
  }

  private _restartAutoRefresh() {
    if (this.#autoRefreshInterval) {
      clearInterval(this.#autoRefreshInterval)
      this.#autoRefreshInterval = null
    }
    this._startAutoRefresh()
  }

  private _startAutoRefresh() {
    if (this.#autoRefreshInterval) {
      return
    }

    const intervalMs = this._getAutoRefreshIntervalMs()
    if (!intervalMs) {
      return
    }

    this.#autoRefreshInterval = setInterval(() => {
      if (this.#windowFocused) {
        this._refreshIssues()
      }
    }, intervalMs)
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
            issue = Controller.linearService.toTreeIssue(
              await Controller.linearService.getIssue(issueId),
            )
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

  public async startWorkWithAgent(issue: Issue) {
    if (!(await ensureCursorEnvironment())) {
      void window.showInformationMessage("Start work with agent is available in Cursor only.")
      return
    }

    await launchCursorAgentForIssue(issue, this.#context)
  }

  public async openSettingsTab(tab: SettingsTab): Promise<void> {
    const issue = this.#myIssues.values().next().value
    if (!this.#settingsWebview) {
      this.#settingsWebview = new SettingsWebview(this.#context, this.issuesActions)
    }
    await this.#settingsWebview.open(issue ?? {}, ViewColumn.Active, { tab })
  }

  public async openSettings(
    issue: Issue,
    options?: { tab?: "git" | "workflow" | "agent" },
  ): Promise<void> {
    if (!this.#settingsWebview) {
      this.#settingsWebview = new SettingsWebview(this.#context, this.issuesActions)
    }
    await this.#settingsWebview.open(issue, ViewColumn.Active, options)
  }

  public async openPullRequestForIssue(issue: Issue) {
    const issueState = this.issuesStore.get(issue.id)
    if (!issueState?.branchInitialized || !issueState.branch?.name) {
      window.showWarningMessage(`No branch configured for issue ${issue.identifier}.`)
      return
    }

    await Controller.gitProviderService.openPullRequestForIssue(
      {
        identifier: issue.identifier,
        title: issue.title,
        url: issue.url,
      },
      issueState.branch.name,
    )
  }

  public async checkoutToIssueBranch(issueId: Issue["id"]) {
    await this.#notifyUncommittedChangesIfAny()

    const issueState = this.issuesStore.get(issueId)

    if (issueState.branchInitialized && issueState.branch) {
      if (!this.#isStashBeforeCreateEnabled()) {
        const issue = await this.#getIssueById(issueId)
        if (!issue) return
        await this.startWork(issue)
        return
      }

      try {
        await Controller.git.checkout(issueState.branch)
        return
      } catch (error) {
        await this.issuesStore.set(issueId, {
          branchInitialized: false,
          branch: undefined,
        })
        await this.issuesActions.refetchIssue(issueId)
      }
    }

    const issue = await this.#getIssueById(issueId)

    if (!issue) return

    this.startWork(issue, true)
  }

  #isStashBeforeCreateEnabled(): boolean {
    const branchesSettings =
      this.#context.globalState.get<SettingsVscState>(VscStateKeys.branchesSettings) || {}

    return !!branchesSettings.stashBeforeCreate
  }

  async #notifyUncommittedChangesIfAny(): Promise<void> {
    if (!Controller.git.repositoryActive) {
      return
    }

    try {
      const hasUncommittedChanges = await Controller.git.hasUncommittedChanges()
      if (!hasUncommittedChanges) {
        return
      }

      window.showInformationMessage(
        "You have uncommitted changes in your working directory. Stash them before changing branches, then reapply them after the branch changes.",
      )
    } catch {
      // Ignore git status errors and continue with the checkout flow.
    }
  }

  async #getIssueById(issueId: Issue["id"]): Promise<Issue | undefined> {
    const cachedIssue = this.#myIssues.get(issueId)
    if (cachedIssue) {
      return cachedIssue
    }

    try {
      const issue = Controller.linearService.toTreeIssue(
        await Controller.linearService.getIssue(issueId),
      )
      this.#myIssues.set(issue.id, issue)
      return issue
    } catch {
      window.showErrorMessage("Failed to fetch issue from Linear")
      return undefined
    }
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

  issuesActions = {
    openIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return

      const issue = this.#myIssues.get(issueId)
      if (issue) {
        await this.openIssue(issue)
      } else {
        const issueWithKey = Controller.linearService.toTreeIssue(
          await Controller.linearService.getIssue(issueId),
        )
        this.#myIssues.set(issueWithKey.id, issueWithKey)
        await this.openIssue(issueWithKey)
      }
    },
    openIssueExternal: this.openIssueExternal.bind(this) as typeof this.openIssueExternal,
    updateIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return

      if (this.#myIssues.has(issueId)) {
        const issue = Controller.linearService.toTreeIssue(
          await Controller.linearService.getIssue(issueId, { bypassCache: true }),
        )
        this.#myIssues.set(issue.id, issue)
        await this._refreshAssigneeIcons(Array.from(this.#myIssues.values()))
        this.#onDidChangeTreeData.fire()
      }
    },
    syncIssue: async (payload: IssueSyncPayload) => {
      const cached = this.#myIssues.get(payload.issueId)
      if (!cached) {
        return
      }

      if (payload.stateId && payload.stateId !== cached.stateId) {
        await this._refetchIssue(payload.issueId)
        return
      }

      if (
        payload.assigneeId !== undefined &&
        (payload.assigneeId ?? null) !== (cached.assigneeId ?? null)
      ) {
        await this._refreshIssues()
        return
      }

      if (payload.title !== undefined) {
        Object.assign(cached, { title: payload.title })
      }
      if (payload.identifier !== undefined) {
        Object.assign(cached, { identifier: payload.identifier })
      }
      if (payload.priority !== undefined) {
        Object.assign(cached, { priority: payload.priority })
      }
      if (payload.updatedAt) {
        Object.assign(cached, { updatedAt: new Date(payload.updatedAt) })
      }

      this._updateWebviewsIfNeeded(cached)
      this.#onDidChangeTreeData.fire()
    },
    startWork: async (issueId: Issue["id"]) => {
      if (!issueId) return

      const issue = this.#myIssues.get(issueId)
      if (issue) {
        await this.startWork(issue)
      } else {
        const issueWithKey = Controller.linearService.toTreeIssue(
          await Controller.linearService.getIssue(issueId),
        )
        this.#myIssues.set(issueWithKey.id, issueWithKey)
        await this.startWork(issueWithKey)
      }
    },
    launchCursorAgent: async (issueId: Issue["id"]) => {
      if (!issueId) {
        return
      }

      const issue = this.#myIssues.get(issueId)
      if (issue) {
        await this.startWorkWithAgent(issue)
        return
      }

      const issueWithKey = Controller.linearService.toTreeIssue(
        await Controller.linearService.getIssue(issueId),
      )
      this.#myIssues.set(issueWithKey.id, issueWithKey)
      await this.startWorkWithAgent(issueWithKey)
    },
    refetchIssue: this._refetchIssue.bind(this) as typeof this._refetchIssue,
    refreshIssues: this._refreshIssues.bind(this) as typeof this._refreshIssues,
    checkoutToIssueBranch: this.checkoutToIssueBranch.bind(
      this,
    ) as typeof this.checkoutToIssueBranch,
    openSettings: async (
      issueId: Issue["id"],
      options?: { tab?: "git" | "workflow" | "agent" },
    ) => {
      if (!issueId) return

      const issue = this.#myIssues.get(issueId)
      if (issue) {
        await this.openSettings(issue, options)
      } else {
        const issueWithKey = Controller.linearService.toTreeIssue(
          await Controller.linearService.getIssue(issueId),
        )
        this.#myIssues.set(issueWithKey.id, issueWithKey)
        await this.openSettings(issueWithKey, options)
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
    const expansionState = this.#getExpansionState()

    if (element.__key === "team") {
      const defaultExpanded = true
      const expanded =
        expansionState.getCollapsibleState(element.id, defaultExpanded) ===
        TreeItemCollapsibleState.Expanded
      item = createTeamTreeItem(element, expanded)
    } else if (element.__key === "workflowState") {
      const issuesCount = this._getIssuesCountForState(element.id)
      const defaultExpanded = getDefaultWorkflowStateExpanded(element.type)
      const expanded =
        expansionState.getCollapsibleState(element.id, defaultExpanded) ===
        TreeItemCollapsibleState.Expanded
      item = createWorkflowStateTreeItem(
        element as unknown as WorkflowStateWithStateProgress,
        issuesCount,
        expanded,
      )
    } else {
      const issueState = this.issuesStore.get(element.id)
      const branchName = issueState?.branchInitialized ? issueState.branch?.name : undefined
      const assigneeUserId = element.assigneeId ?? UNASSIGNED_ASSIGNEE_ID
      const assigneeIconUri =
        this.#assigneeIconByUserId.get(assigneeUserId) ??
        this.#assigneeIconByUserId.get(UNASSIGNED_ASSIGNEE_ID)
      const assigneeEmail = element.assigneeId
        ? this.#assigneeByUserId.get(element.assigneeId)?.email
        : undefined
      item = createIssueTreeItem(element, branchName, assigneeIconUri, assigneeEmail)
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

        await Controller.linearService.updateIssue(issue.id, {
          stateId: targetStateId,
        })

        await this._refetchIssue(issue.id)
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

    this.#disposables.forEach((d) => d.dispose())
    this.#disposables = []
    this.#treeView = null

    this.#issuesWebviews.forEach((webview) => webview.dispose())
    this.#issuesWebviews.clear()
    this.#startWorkWebviews.forEach((webview) => webview.dispose())
    this.#startWorkWebviews.clear()
    this.#settingsWebview?.dispose()
    this.#settingsWebview = undefined

    this.#treeItems.clear()
    this.#myIssues.clear()
    this.#assigneeIconByUserId.clear()
    this.#assigneeByUserId.clear()
    this.#workflowStatesByTeam = {}
    this.#teams = {}
    this.#me = null
  }
}

import { Issue, User } from "@linear/sdk"
import { Commands, Views } from "src/constants"
import { Controller } from "src/controller"
import { PullRequestInfo } from "src/gitProviders/types"
import { RefType } from "src/types/GitAPI"
import { parseIssueIdentifierFromPullRequest } from "src/utils/parseIssueIdentifier"
import {
  buildUserAvatarIconCacheForContext,
  UNASSIGNED_ASSIGNEE_ID,
} from "src/utils/userAvatarIcon"
import {
  commands,
  Disposable,
  env,
  ExtensionContext,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  Uri,
  window,
  EventEmitter,
} from "vscode"

import { createMessageTreeItem, createPullRequestTreeItem, toPullRequestItem } from "./treeItems"
import { MessageItem, PullRequestItem, PullRequestTreeNode } from "./types"

export class PullRequestsView implements TreeDataProvider<PullRequestTreeNode> {
  #onDidChangeTreeData = new EventEmitter<void>()
  onDidChangeTreeData = this.#onDidChangeTreeData.event

  #context: ExtensionContext | null = null
  #treeItems = new Map<string, TreeItem>()
  #nodes: PullRequestTreeNode[] = []
  #assigneeIconByUserId = new Map<string, Uri>()
  #loading = false
  #disposables: Disposable[] = []

  #treeView: ReturnType<typeof window.createTreeView<PullRequestTreeNode>> | null = null

  public async initialize(context: ExtensionContext): Promise<void> {
    this.#context = context
    this.#treeView = window.createTreeView(Views.pullRequests, {
      treeDataProvider: this,
      showCollapseAll: false,
    })
    context.subscriptions.push(this.#treeView)

    const authDisposable = Controller.gitProviderService.onAuthContextChanged(() => {
      void this.refresh()
    })
    context.subscriptions.push(authDisposable)
    this.#disposables.push(authDisposable)

    const visibilityDisposable = this.#treeView.onDidChangeVisibility((event) => {
      if (event.visible) {
        void this.refresh()
      }
    })
    context.subscriptions.push(visibilityDisposable)
    this.#disposables.push(visibilityDisposable)

    context.subscriptions.push(
      commands.registerCommand(Commands.refreshPullRequests, () => this.refresh()),
      commands.registerCommand(Commands.openPullRequestDiff, (pullRequest: PullRequestInfo) =>
        this.openPullRequestDiff(pullRequest),
      ),
      commands.registerCommand(
        Commands.openPullRequestLinkedIssue,
        (pullRequest: PullRequestInfo) => this.openPullRequestLinkedIssue(pullRequest),
      ),
      commands.registerCommand(Commands.openPullRequestUrl, (pullRequest: PullRequestInfo) =>
        this.openPullRequestOnWeb(pullRequest),
      ),
      commands.registerCommand(Commands.checkoutPullRequestBranch, (pullRequest: PullRequestInfo) =>
        this.checkoutPullRequestBranch(pullRequest),
      ),
    )

    await this.refresh()
  }

  public refresh(): Promise<void> {
    return this.#fetchPullRequests()
  }

  public changeGitStatus(): void {
    void this.refresh()
  }

  public dispose(): void {
    this.#disposables.forEach((disposable) => disposable.dispose())
    this.#disposables = []
    this.#treeView = null
    this.#context = null
  }

  getTreeItem(element: PullRequestTreeNode): TreeItem {
    const cached = this.#treeItems.get(
      element.__key === "message" ? element.id : `pull-request:${element.id}`,
    )
    if (cached) {
      return cached
    }

    const item =
      element.__key === "message"
        ? createMessageTreeItem(element)
        : createPullRequestTreeItem(
            element,
            element.linkedAssigneeUserId
              ? (this.#assigneeIconByUserId.get(element.linkedAssigneeUserId) ??
                  this.#assigneeIconByUserId.get(UNASSIGNED_ASSIGNEE_ID))
              : undefined,
          )

    this.#treeItems.set(item.id ?? String(element.id), item)
    return item
  }

  getChildren(element?: PullRequestTreeNode): ProviderResult<PullRequestTreeNode[]> {
    if (element) {
      return []
    }

    if (this.#loading) {
      return [this.#messageNode("Loading pull requests…")]
    }

    return this.#nodes
  }

  async #fetchPullRequests(): Promise<void> {
    this.#loading = true
    this.#treeItems.clear()
    this.#onDidChangeTreeData.fire()

    const result = await Controller.gitProviderService.listOpenPullRequests()

    this.#loading = false
    this.#treeItems.clear()

    if (result.error) {
      this.#nodes = [this.#messageNode(result.error)]
      this.#assigneeIconByUserId.clear()
    } else if (result.pullRequests.length === 0) {
      this.#nodes = [this.#messageNode("No open pull requests for this repository.")]
      this.#assigneeIconByUserId.clear()
    } else {
      this.#nodes = await this.#enrichPullRequestsWithAssigneeIcons(result.pullRequests)
    }

    this.#onDidChangeTreeData.fire()
  }

  async #enrichPullRequestsWithAssigneeIcons(
    pullRequests: PullRequestInfo[],
  ): Promise<PullRequestItem[]> {
    const assigneeIdByIdentifier = new Map<string, string>()
    const linkedIssues: Issue[] = []

    const identifiers = [
      ...new Set(
        pullRequests
          .map((pullRequest) => parseIssueIdentifierFromPullRequest(pullRequest))
          .filter((identifier): identifier is string => !!identifier),
      ),
    ]

    await Promise.all(
      identifiers.map(async (identifier) => {
        try {
          const issue = await Controller.linearService.getIssueByIdentifier(identifier)
          if (!issue) {
            return
          }

          linkedIssues.push(issue)
          assigneeIdByIdentifier.set(identifier, issue.assigneeId ?? UNASSIGNED_ASSIGNEE_ID)
        } catch {
          // Keep the default pull request icon when the linked issue cannot be resolved.
        }
      }),
    )

    if (this.#context && linkedIssues.length > 0) {
      const assigneeUsers = await this.#resolveAssigneeUsers(linkedIssues)
      this.#assigneeIconByUserId = await buildUserAvatarIconCacheForContext(
        this.#context,
        assigneeUsers,
      )
    } else {
      this.#assigneeIconByUserId.clear()
    }

    return pullRequests.map((pullRequest) => {
      const item = toPullRequestItem(pullRequest)
      const identifier = parseIssueIdentifierFromPullRequest(pullRequest)
      const linkedAssigneeUserId = identifier ? assigneeIdByIdentifier.get(identifier) : undefined

      return identifier
        ? {
            ...item,
            linkedIssueIdentifier: identifier,
            ...(linkedAssigneeUserId ? { linkedAssigneeUserId } : {}),
          }
        : item
    })
  }

  async #resolveAssigneeUsers(issues: Issue[]): Promise<User[]> {
    const workspaceUsers = await Controller.linearService.getWorkspaceUsers()
    const usersById = new Map(workspaceUsers.map((user) => [user.id, user]))

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

  #messageNode(message: string): MessageItem {
    return {
      __key: "message",
      id: `message:${message}`,
      message,
    }
  }

  private async openPullRequestDiff(pullRequest: PullRequestInfo): Promise<void> {
    const sourceBranch = pullRequest.sourceBranch?.trim()
    const targetBranch = pullRequest.targetBranch?.trim()

    if (!sourceBranch || !targetBranch) {
      window.showErrorMessage("This pull request is missing source or target branch information.")
      return
    }

    try {
      await Controller.git.openPullRequestMultiDiff({
        sourceBranch,
        targetBranch,
        title: pullRequest.title?.trim() || `#${pullRequest.id}`,
      })
    } catch (error) {
      window.showErrorMessage(
        error instanceof Error ? error.message : "Failed to open pull request diff.",
      )
    }
  }

  private async openPullRequestLinkedIssue(pullRequest: PullRequestInfo): Promise<void> {
    const issueIdentifier = parseIssueIdentifierFromPullRequest(pullRequest)
    if (!issueIdentifier) {
      window.showInformationMessage("No Linear issue identifier was found for this pull request.")
      return
    }

    try {
      const issue = await Controller.linearService.getIssueByIdentifier(issueIdentifier)
      if (!issue) {
        window.showInformationMessage(`Linear issue ${issueIdentifier} was not found.`)
        return
      }

      await Controller.issueViewer.openIssue(Controller.linearService.toTreeIssue(issue))
    } catch (error) {
      window.showErrorMessage(
        error instanceof Error ? error.message : `Failed to open Linear issue ${issueIdentifier}.`,
      )
    }
  }

  private async openPullRequestOnWeb(pullRequest: PullRequestInfo): Promise<void> {
    if (!pullRequest.url) {
      window.showErrorMessage("This pull request does not include a web URL.")
      return
    }

    await env.openExternal(Uri.parse(pullRequest.url))
  }

  private async checkoutPullRequestBranch(pullRequest: PullRequestInfo): Promise<void> {
    const branchName = pullRequest.sourceBranch?.trim()
    if (!branchName) {
      window.showErrorMessage("This pull request does not include a source branch.")
      return
    }

    try {
      await Controller.git.checkout({ type: RefType.Head, name: branchName })
    } catch (error) {
      window.showErrorMessage(
        error instanceof Error ? error.message : "Failed to checkout pull request branch.",
      )
    }
  }
}

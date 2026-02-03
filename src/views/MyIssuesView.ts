import {
  Issue as LIssue,
  Team as LTeam,
  WorkflowState as LWorkflowState,
  LinearClient,
  User,
} from "@linear/sdk";
import {
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window,
  EventEmitter,
  TreeItemCollapsibleState,
  TreeDragAndDropController,
  DataTransfer,
  DataTransferItem,
  ExtensionContext,
  ViewColumn,
  commands,
  Disposable,
  Uri,
} from "vscode";
import { getLinearClient } from "../linear/auth";
import { Commands, Views } from "../constants";
import { filterWorkflowStatesByType } from "src/panels/commons/worflowStates";
import { IssueWebview } from "src/panels/IssueWebview";
import { Controller } from "src/controller";
import { WorkflowStateWithStateProgress } from "src/types/Linear";
import { StartWorkWebview } from "src/panels/StartWorkWebview";
import { Stores } from "src/utils/Stores";

export const MIME_TYPE_ISSUE = "application/vnd.code.issueViewer.issue";

const AUTO_REFRESH_INTERVAL_MS = 30 * 1000; // 30 seconds

function addKeyOnItem<
  I extends object,
  K extends "issue" | "team" | "workflowState",
>(item: I, key: K): I & { __key: K } {
  return { ...item, __key: key };
}

type Team = ReturnType<typeof addKeyOnItem<LTeam, "team">>;
type WorkflowState = ReturnType<
  typeof addKeyOnItem<LWorkflowState, "workflowState">
>;
type Issue = ReturnType<typeof addKeyOnItem<LIssue, "issue">>;

export class MyIssuesView
  implements
    TreeDataProvider<Team | WorkflowState | Issue>,
    TreeDragAndDropController<Issue | WorkflowState | Team>
{
  dropMimeTypes = [MIME_TYPE_ISSUE];
  dragMimeTypes = [MIME_TYPE_ISSUE];

  #onDidChangeTreeData = new EventEmitter<void>();
  #treeItems = new Map<string, TreeItem>();

  #context: ExtensionContext;
  #linearClient = getLinearClient() as LinearClient;
  #me: User | null = null;
  #teams: Record<string, Team> = {};
  #workflowStatesByTeam: Record<string, Record<string, WorkflowState>> = {};
  #myIssues: Map<string, Issue> = new Map();
  protected issuesStore: ReturnType<Stores["issuesStore"]>;

  #autoRefreshInterval: NodeJS.Timeout | null = null;
  #issuesWebviews: Map<string, IssueWebview> = new Map();
  #startWorkWebviews: Map<string, StartWorkWebview> = new Map();

  #disposable: Disposable[] = [];

  constructor(context: ExtensionContext) {
    this.#context = context;
    this.issuesStore = new Stores(context).issuesStore();
  }

  onDidChangeTreeData = this.#onDidChangeTreeData.event;

  public async initialize(context: ExtensionContext): Promise<void> {
    await this.fetchDatas();

    this._startAutoRefresh();

    context.subscriptions.push(
      window.createTreeView(Views.myIssues, {
        treeDataProvider: this,
        dragAndDropController: this,
        showCollapseAll: true,
        canSelectMany: true,
      }),
    );

    const disposableCommands = [
      commands.registerCommand(Commands.openIssue, (issue: Issue) =>
        this.openIssue(issue),
      ),
      commands.registerCommand(
        Commands.openIssueExternal,
        async (issueIdentifier: Issue["identifier"] | Issue) =>
          await this.openIssueExternal(issueIdentifier),
      ),
      commands.registerCommand(Commands.startWork, (issue: Issue) =>
        this.startWork(issue),
      ),
      commands.registerCommand(Commands.checkoutIssue, (issue: Issue) =>
        this.checkoutToIssueBranch(issue.id),
      ),
    ];

    this.#context.subscriptions.push(...disposableCommands);
    this.#disposable.push(...disposableCommands);
  }

  public async fetchDatas() {
    await this._getWorkflowStates();
    await this._getIssues();
  }

  public async openIssue(issue: Issue) {
    let webview = this.#issuesWebviews.get(issue.id);
    if (!webview) {
      webview = new IssueWebview(this.#context, this.issuesActions);
      this.#issuesWebviews.set(issue.id, webview);
    }
    await webview.open(issue, ViewColumn.Active);
  }

  public async openIssueExternal(issueIdentifier: Issue["identifier"] | Issue) {
    const identififer =
      typeof issueIdentifier === "string"
        ? issueIdentifier
        : issueIdentifier.identifier;

    const organisation = await this.#me?.organization;
    if (organisation?.urlKey) {
      const url = `https://linear.app/${organisation.urlKey}/issue/${identififer}`;
      await commands.executeCommand("vscode.open", Uri.parse(url));
    }
  }

  public async startWork(issue: Issue, fromCheckout?: true) {
    let webview = this.#startWorkWebviews.get(issue.id);
    if (!webview) {
      webview = new StartWorkWebview(
        this.#context,
        this.issuesActions,
        fromCheckout,
      );
      this.#startWorkWebviews.set(issue.id, webview);
    }
    await webview.open(issue, ViewColumn.Active);
  }

  public async checkoutToIssueBranch(issueId: Issue["id"]) {
    const issueState = this.issuesStore.get(issueId);

    if (issueState.branchInitialized && issueState.branch) {
      Controller.git.checkout(issueState.branch);
      return;
    }

    const issue =
      this.#myIssues.get(issueId) ||
      addKeyOnItem(await this.#linearClient.issue(issueId), "issue");

    if (!issue) return;

    this.startWork(issue, true);
  }

  public getChildren(
    element?: Team | WorkflowState | Issue | undefined,
  ): ProviderResult<Team[] | WorkflowState[] | Issue[]> {
    if (element?.__key === "team") {
      return this._tree.getState(element.id);
    }

    if (element?.__key === "workflowState") {
      return this._tree.getIssue(element.id);
    }

    if (!element) {
      return this._tree.getTeam();
    }

    return [];
  }

  public changeGitStatus(gitStatus: {
    repoActive: boolean;
    apiActive: boolean;
  }) {
    this.#issuesWebviews
      .values()
      .forEach((webview) =>
        webview.postListenerMessage("gitActive", gitStatus),
      );
    this.#startWorkWebviews
      .values()
      .forEach((webview) =>
        webview.postListenerMessage("gitActive", gitStatus),
      );
  }

  public getTreeItem(element: Team | WorkflowState | Issue) {
    if (element.__key === "team") {
      return this._getTeamTreeItem(element);
    }
    if (element.__key === "workflowState") {
      return this._getWorkflowStateTreeItem(
        element as unknown as WorkflowStateWithStateProgress,
      );
    }

    return this._getIssueTreeItem(element);
  }

  public async handleDrop(
    target: Team | WorkflowState | Issue | undefined,
    sources: DataTransfer,
  ): Promise<void> {
    const issues: Issue[] = [];

    sources.forEach((value, key) => {
      if (key.toLocaleLowerCase().startsWith(MIME_TYPE_ISSUE.toLowerCase())) {
        issues.push(value.value as Issue);
      }
    });

    await Promise.all(
      issues.map(async (issue) => {
        if (!issue || issue.__key !== "issue") {
          return;
        }

        if (!target || !["workflowState", "issue"].includes(target.__key)) {
          return;
        }

        const targetStateId =
          // @ts-expect-error
          target.__key === "workflowState" ? target.id : target._state.id;

        await this.#linearClient.updateIssue(issue.id, {
          stateId: targetStateId,
        });

        await this._getIssues();
      }),
    );
  }

  public async handleDrag(
    source: (Issue | WorkflowState | Team)[],
    treeDataTransfer: DataTransfer,
  ): Promise<void> {
    if (!source) {
      return;
    }

    const issues = source.filter((s) => s.__key === "issue") as Issue[];

    if (issues.length === 0) {
      return;
    }

    issues.forEach((issue, index) => {
      const item = new DataTransferItem(issue);
      treeDataTransfer.set(`${MIME_TYPE_ISSUE}_${index}`, item);
    });
  }

  public refresh(): void {
    this.fetchDatas();
  }

  issuesActions = {
    openIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return;

      const issue = this.#myIssues.get(issueId);
      if (issue) {
        await this.openIssue(issue);
      } else {
        const fetchedIssue = await this.#linearClient.issue(issueId);
        const issueWithKey = addKeyOnItem(fetchedIssue, "issue");
        this.#myIssues.set(issueWithKey.id, issueWithKey);
        await this.openIssue(issueWithKey);
      }
    },
    openIssueExternal: this.openIssueExternal.bind(this),
    updateIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return;

      if (this.#myIssues.has(issueId)) {
        const issue = await this.#linearClient.issue(issueId);
        this.#myIssues.set(issue.id, addKeyOnItem(issue, "issue"));
        this.#onDidChangeTreeData.fire();
      }
    },
    startWork: async (issueId: Issue["id"]) => {
      if (!issueId) return;

      const issue = this.#myIssues.get(issueId);
      if (issue) {
        await this.startWork(issue);
      } else {
        const fetchedIssue = await this.#linearClient.issue(issueId);
        const issueWithKey = addKeyOnItem(fetchedIssue, "issue");
        this.#myIssues.set(issueWithKey.id, issueWithKey);
        await this.startWork(issueWithKey);
      }
    },
  };

  private _startAutoRefresh() {
    if (this.#autoRefreshInterval) {
      return;
    }
    this.#autoRefreshInterval = setInterval(
      () => this._getIssues(),
      AUTO_REFRESH_INTERVAL_MS,
    );
  }

  private async _getMe() {
    if (this.#me || !this.#linearClient) {
      return this.#me;
    }
    this.#me = await this.#linearClient.viewer;
    return this.#me;
  }

  private async _getTeams() {
    try {
      const viewer = await this._getMe();

      if (!viewer) {
        return {};
      }

      const teams = await viewer.teams({ first: 50 });
      this.#teams = teams.nodes.reduce(
        (acc, team) => {
          acc[team.id] = addKeyOnItem(team, "team");
          return acc;
        },
        {} as Record<string, Team>,
      );
      return this.#teams;
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch user teams: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return {};
  }

  private async _getWorkflowStates() {
    try {
      const teams = await this._getTeams();

      for (const teamId in teams) {
        const workflowStates = await this.#linearClient.workflowStates({
          filter: { team: { id: { eq: teamId } } },
        });

        this.#workflowStatesByTeam[teamId] = workflowStates.nodes.reduce(
          (acc, state) => {
            acc[state.id] = addKeyOnItem(state, "workflowState");
            return acc;
          },
          {} as Record<string, WorkflowState>,
        );
      }
      return this.#workflowStatesByTeam;
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch assigned issues: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return {};
  }

  private async _getIssues() {
    try {
      const viewer = await this._getMe();
      if (!viewer) {
        return;
      }

      const issues = await viewer.assignedIssues({ first: 250 });

      issues.nodes.forEach((issue) => {
        // issues webviews
        const issuePanel = this.#issuesWebviews.get(issue.id);
        const webviewPanel = this.#startWorkWebviews.get(issue.id);

        if (
          issuePanel?.visible &&
          issuePanel?.issue?.updatedAt &&
          issuePanel.issue.updatedAt.getTime() !== issue.updatedAt.getTime()
        ) {
          issuePanel?.updateWebview(issue);
        }

        // startWork webviews
        if (
          webviewPanel?.visible &&
          webviewPanel?.issue?.updatedAt &&
          webviewPanel.issue.updatedAt.getTime() !== issue.updatedAt.getTime()
        ) {
          webviewPanel?.updateWebview(issue);
        }

        this.#myIssues.set(issue.id, addKeyOnItem(issue, "issue"));
      });

      this.#onDidChangeTreeData.fire();
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch assigned issues: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private _getTeamTreeItem(team: Team) {
    const item = new TreeItem(team.name, TreeItemCollapsibleState.Expanded);
    item.id = team.id;
    if (team.description) {
      item.description = team.description;
    }

    this.#treeItems.set(item.id!, item);

    return item;
  }

  private _getWorkflowStateTreeItem(state: WorkflowStateWithStateProgress) {
    const issuesCount = Array.from(this.#myIssues.values()).filter(
      // @ts-expect-error
      (issue) => issue._state.id === state.id,
    ).length;

    const item = new TreeItem(
      state.name,
      ["unstarted", "started"].includes(state.type)
        ? TreeItemCollapsibleState.Expanded
        : TreeItemCollapsibleState.Collapsed,
    );
    item.id = state.id;
    item.description = `${issuesCount}`;

    item.iconPath = Controller.resources.icons.get(
      state.type === "started"
        ? `started${Math.ceil(
            Math.min(
              Math.max((10 / state.stateTypeLength) * state.stateProgress, 0),
              10,
            ),
          )}`
        : state.type,
    );

    this.#treeItems.set(item.id!, item);

    return item;
  }

  private _getIssueTreeItem(issue: Issue) {
    const item = new TreeItem(
      `${issue.identifier}`,
      TreeItemCollapsibleState.None,
    );
    item.id = issue.id;
    item.tooltip = issue.title;
    item.description = `- ${issue.trashed ? "[trashed] " : ""}${issue.title}`;

    item.contextValue = "issueItem";
    item.iconPath = Controller.resources.icons.get("treeIssue");

    item.command = {
      title: "Open Issue",
      command: Commands.openIssue,
      arguments: [issue],
    };

    this.#treeItems.set(item.id!, item);

    return item;
  }

  private _tree = {
    getTeam: (): Team[] | WorkflowState[] | null => {
      const teams = Object.values(this.#teams).filter((team) =>
        Array.from(this.#myIssues.values()).some(
          // @ts-expect-error
          (issue) => issue._team.id === team.id,
        ),
      );

      if (teams.length === 0) {
        return null;
      }
      if (teams.length === 1) {
        return this._tree.getState(teams[0].id);
      }

      return teams;
    },
    getState: (teamId: Team["id"]): WorkflowState[] => {
      return filterWorkflowStatesByType(
        Object.values(this.#workflowStatesByTeam[teamId]),
      ) as unknown as WorkflowState[];
    },
    getIssue: (stateId: WorkflowState["id"]) => {
      const issue = Array.from(this.#myIssues.values()).filter(
        // @ts-expect-error
        (issue) => issue._state.id === stateId,
      );
      return issue;
    },
  };

  public dispose() {
    if (this.#autoRefreshInterval) {
      clearInterval(this.#autoRefreshInterval);
      this.#autoRefreshInterval = null;
    }

    this.#onDidChangeTreeData.dispose();
    this.#disposable.forEach((d) => d.dispose());

    this.#issuesWebviews.forEach((webview) => webview.dispose());
    this.#issuesWebviews.clear();
    this.#startWorkWebviews.forEach((webview) => webview.dispose());
    this.#startWorkWebviews.clear();

    this.#treeItems.clear();
    this.#myIssues.clear();
    this.#workflowStatesByTeam = {};
    this.#teams = {};
    this.#me = null;
  }
}

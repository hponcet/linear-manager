import {
  Issue as LIssue,
  Team as LTeam,
  WorkflowState as LWorkflowState,
  LinearClient,
  User,
} from "@linear/sdk";
import { getLinearClient } from "../linear/auth";
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
} from "vscode";
import { Commands, Views } from "../constants";
import { filterWorkflowStatesByType } from "src/panels/commons/worflowStates";
import { IssueWebview } from "src/panels/IssueWebview";
import { Controller } from "src/controller";
import { WorkflowStateWithStateProgress } from "src/types/Linear";

const AUTO_REFRESH_INTERVAL_MS = 30 * 1000; // 30 seconds

function addKeyOnItem<
  I extends object,
  K extends "issue" | "team" | "workflowState"
>(item: I, key: K): I & { __key: K } {
  return { ...item, __key: key };
}

type Team = ReturnType<typeof addKeyOnItem<LTeam, "team">>;
type WorkflowState = ReturnType<
  typeof addKeyOnItem<LWorkflowState, "workflowState">
>;
type Issue = ReturnType<typeof addKeyOnItem<LIssue, "issue">>;

export class LinearIssuesViewerProvider
  implements
    TreeDataProvider<Team | WorkflowState | Issue>,
    TreeDragAndDropController<Issue | WorkflowState | Team>
{
  dropMimeTypes = ["application/vnd.code.issueViewer.issue"];
  dragMimeTypes = ["text/uri-list"];

  private _onDidChangeTreeData = new EventEmitter<void>();
  private _treeItems = new Map<string, TreeItem>();

  private _context: ExtensionContext;
  private _linearClient = getLinearClient() as LinearClient;
  private _me: User | null = null;
  private _teams: Record<string, Team> = {};
  private _workflowStatesByTeam: Record<string, Record<string, WorkflowState>> =
    {};
  private _myIssues: Issue[] = [];

  private _autoRefreshInterval: NodeJS.Timeout | null = null;
  private _issues: Map<string, IssueWebview> = new Map();

  constructor(context: ExtensionContext) {
    this._context = context;
  }

  onDidChangeTreeData = this._onDidChangeTreeData.event;

  public async initialize(context: ExtensionContext): Promise<void> {
    await this.fetchDatas();
    this._startAutoRefresh();

    context.subscriptions.push(
      window.createTreeView(Views.myIssues, {
        treeDataProvider: this,
        dragAndDropController: this,
        showCollapseAll: true,
      })
    );

    this._context.subscriptions.push(
      commands.registerCommand(Commands.openIssue, (issue: Issue) =>
        this.openIssue(issue)
      )
    );
  }

  public async fetchDatas() {
    await this._getWorkflowStates();
    await this._getIssues();
  }

  public async openIssue(issue: Issue) {
    let webview = this._issues.get(issue.id);
    if (!webview) {
      webview = new IssueWebview(this._context);
      this._issues.set(issue.id, webview);
    }
    await webview.create(issue, ViewColumn.Active);
  }

  public getChildren(
    element?: Team | WorkflowState | Issue | undefined
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

  public getTreeItem(element: Team | WorkflowState | Issue) {
    if (element.__key === "team") {
      return this._getTeamTreeItem(element);
    }
    if (element.__key === "workflowState") {
      return this._getWorkflowStateTreeItem(
        element as unknown as WorkflowStateWithStateProgress
      );
    }

    return this._getIssueTreeItem(element);
  }

  public async handleDrop(
    target: Team | WorkflowState | Issue | undefined,
    sources: DataTransfer
  ): Promise<void> {
    const transferItem = sources.get("application/vnd.code.issueViewer.issue");
    if (!transferItem) {
      return;
    }

    const issue = transferItem.value as Issue;
    if (!issue || issue.__key !== "issue") {
      return;
    }

    if (!target || !["workflowState", "issue"].includes(target.__key)) {
      return;
    }

    const targetStateId =
      // @ts-expect-error
      target.__key === "workflowState" ? target.id : target._state.id;

    await this._linearClient.updateIssue(issue.id, {
      stateId: targetStateId,
    });

    await this._getIssues();

    const treeItem = this._treeItems.get(targetStateId);

    if (treeItem) {
      treeItem.collapsibleState = TreeItemCollapsibleState.Expanded;
      this._onDidChangeTreeData.fire();
    }
  }

  public async handleDrag(
    source: [Issue | WorkflowState | Team],
    treeDataTransfer: DataTransfer
  ): Promise<void> {
    if (!source || source[0].__key !== "issue") {
      return;
    }
    const item = new DataTransferItem(source[0]);
    treeDataTransfer.set("application/vnd.code.issueViewer.issue", item);
  }

  public refresh(): void {
    this.fetchDatas();
  }

  public dispose() {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
      this._autoRefreshInterval = null;
    }

    this._issues.forEach((webview) => webview.dispose());
    this._issues.clear();
  }

  private _startAutoRefresh() {
    if (this._autoRefreshInterval) {
      return;
    }
    this._autoRefreshInterval = setInterval(
      () => this._getIssues(),
      AUTO_REFRESH_INTERVAL_MS
    );
  }

  private async _getMe() {
    if (this._me) {
      return this._me;
    }
    this._me = await this._linearClient.viewer;
    return this._me;
  }

  private async _getTeams() {
    try {
      const viewer = await this._getMe();
      const teams = await viewer.teams({ first: 50 });
      this._teams = teams.nodes.reduce((acc, team) => {
        acc[team.id] = addKeyOnItem(team, "team");
        return acc;
      }, {} as Record<string, Team>);
      return this._teams;
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch user teams: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    return {};
  }

  private async _getWorkflowStates() {
    try {
      const teams = await this._getTeams();

      for (const teamId in teams) {
        const workflowStates = await this._linearClient.workflowStates({
          filter: { team: { id: { eq: teamId } } },
        });

        this._workflowStatesByTeam[teamId] = workflowStates.nodes.reduce(
          (acc, state) => {
            acc[state.id] = addKeyOnItem(state, "workflowState");
            return acc;
          },
          {} as Record<string, WorkflowState>
        );
      }
      return this._workflowStatesByTeam;
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch assigned issues: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    return {};
  }

  private async _getIssues() {
    try {
      const viewer = await this._getMe();
      const issues = await viewer.assignedIssues({ first: 250 });
      this._myIssues = issues.nodes.map((issue) =>
        addKeyOnItem(issue, "issue")
      );
      this._onDidChangeTreeData.fire();
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch assigned issues: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private _getTeamTreeItem(team: Team) {
    const item = new TreeItem(team.name, TreeItemCollapsibleState.Expanded);
    item.id = team.id;
    if (team.description) {
      item.description = team.description;
    }

    this._treeItems.set(item.id!, item);

    return item;
  }

  private _getWorkflowStateTreeItem(state: WorkflowStateWithStateProgress) {
    const issuesCount = this._myIssues.filter(
      // @ts-expect-error
      (issue) => issue._state.id === state.id
    ).length;

    const item = new TreeItem(state.name, TreeItemCollapsibleState.Expanded);
    item.id = state.id;
    item.description = `${issuesCount}`;

    item.iconPath = Controller.resources.icons.get(
      state.type === "started"
        ? `started${Math.ceil(
            Math.min(
              Math.max((10 / state.stateTypeLength) * state.stateProgress, 0),
              10
            )
          )}`
        : state.type
    );

    this._treeItems.set(item.id!, item);

    return item;
  }

  private _getIssueTreeItem(issue: Issue) {
    const item = new TreeItem(
      `${issue.identifier}`,
      TreeItemCollapsibleState.None
    );
    item.id = issue.id;
    item.tooltip = issue.title;
    item.description = `- ${issue.title}`;

    item.contextValue = "issueItem";
    item.iconPath = Controller.resources.icons.get("treeIssue");

    item.command = {
      title: "Open Issue",
      command: Commands.openIssue,
      arguments: [issue],
    };

    this._treeItems.set(item.id!, item);

    return item;
  }

  private _tree = {
    getTeam: (): Team[] | WorkflowState[] | null => {
      const teams = Object.values(this._teams).filter((team) =>
        // @ts-expect-error
        this._myIssues.some((issue) => issue._team.id === team.id)
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
        Object.values(this._workflowStatesByTeam[teamId])
      ) as unknown as WorkflowState[];
    },
    getIssue: (stateId: WorkflowState["id"]) => {
      // @ts-expect-error
      return this._myIssues.filter((issue) => issue._state.id === stateId);
    },
  };
}

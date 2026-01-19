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
import { StartWorkWebview } from "src/panels/StartWorkWebview";

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

  private _onDidChangeTreeData = new EventEmitter<void>();
  private _treeItems = new Map<string, TreeItem>();

  private _context: ExtensionContext;
  private _linearClient = getLinearClient() as LinearClient;
  private _me: User | null = null;
  private _teams: Record<string, Team> = {};
  private _workflowStatesByTeam: Record<string, Record<string, WorkflowState>> =
    {};
  private _myIssues: Map<string, Issue> = new Map();

  private _autoRefreshInterval: NodeJS.Timeout | null = null;
  private _issuesWebviews: Map<string, IssueWebview> = new Map();
  private _startWorkWebviews: Map<string, StartWorkWebview> = new Map();

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
        canSelectMany: true,
      }),
    );

    this._context.subscriptions.push(
      commands.registerCommand(Commands.openIssue, (issue: Issue) =>
        this.openIssue(issue),
      ),
      commands.registerCommand(Commands.startWork, (issue: Issue) =>
        this.startWork(issue),
      ),
    );
  }

  public async fetchDatas() {
    await this._getWorkflowStates();
    await this._getIssues();
  }

  public async openIssue(issue: Issue) {
    let webview = this._issuesWebviews.get(issue.id);
    if (!webview) {
      webview = new IssueWebview(this._context, this._issuesActions);
      this._issuesWebviews.set(issue.id, webview);
    }
    await webview.open(issue, ViewColumn.Active);
  }

  public async startWork(issue: Issue) {
    let webview = this._startWorkWebviews.get(issue.id);
    if (!webview) {
      webview = new StartWorkWebview(this._context, this._issuesActions);
      this._startWorkWebviews.set(issue.id, webview);
    }
    await webview.open(issue, ViewColumn.Active);
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

        await this._linearClient.updateIssue(issue.id, {
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

  _issuesActions = {
    openIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return;

      const issue = this._myIssues.get(issueId);
      if (issue) {
        await this.openIssue(issue);
      } else {
        const fetchedIssue = await this._linearClient.issue(issueId);
        const issueWithKey = addKeyOnItem(fetchedIssue, "issue");
        this._myIssues.set(issueWithKey.id, issueWithKey);
        await this.openIssue(issueWithKey);
      }
    },
    updateIssue: async (issueId: Issue["id"]) => {
      if (!issueId) return;

      if (this._myIssues.has(issueId)) {
        const issue = await this._linearClient.issue(issueId);
        this._myIssues.set(issue.id, addKeyOnItem(issue, "issue"));
        this._onDidChangeTreeData.fire();
      }
    },
    startWork: async (issueId: Issue["id"]) => {
      if (!issueId) return;

      const issue = this._myIssues.get(issueId);
      if (issue) {
        await this.startWork(issue);
      } else {
        const fetchedIssue = await this._linearClient.issue(issueId);
        const issueWithKey = addKeyOnItem(fetchedIssue, "issue");
        this._myIssues.set(issueWithKey.id, issueWithKey);
        await this.startWork(issueWithKey);
      }
    },
  };

  public dispose() {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
      this._autoRefreshInterval = null;
    }

    this._issuesWebviews.forEach((webview) => webview.dispose());
    this._issuesWebviews.clear();
  }

  private _startAutoRefresh() {
    if (this._autoRefreshInterval) {
      return;
    }
    this._autoRefreshInterval = setInterval(
      () => this._getIssues(),
      AUTO_REFRESH_INTERVAL_MS,
    );
  }

  private async _getMe() {
    if (this._me || !this._linearClient) {
      return this._me;
    }
    this._me = await this._linearClient.viewer;
    return this._me;
  }

  private async _getTeams() {
    try {
      const viewer = await this._getMe();

      if (!viewer) {
        return {};
      }

      const teams = await viewer.teams({ first: 50 });
      this._teams = teams.nodes.reduce(
        (acc, team) => {
          acc[team.id] = addKeyOnItem(team, "team");
          return acc;
        },
        {} as Record<string, Team>,
      );
      return this._teams;
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
        const workflowStates = await this._linearClient.workflowStates({
          filter: { team: { id: { eq: teamId } } },
        });

        this._workflowStatesByTeam[teamId] = workflowStates.nodes.reduce(
          (acc, state) => {
            acc[state.id] = addKeyOnItem(state, "workflowState");
            return acc;
          },
          {} as Record<string, WorkflowState>,
        );
      }
      return this._workflowStatesByTeam;
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
        const issuePanel = this._issuesWebviews.get(issue.id);
        const webviewPanel = this._startWorkWebviews.get(issue.id);

        if (
          issuePanel?.visible &&
          issuePanel?._issue?.updatedAt &&
          issuePanel._issue.updatedAt.getTime() !== issue.updatedAt.getTime()
        ) {
          issuePanel?.updateWebview(issue);
        }

        // startWork webviews
        if (
          webviewPanel?.visible &&
          webviewPanel?._issue?.updatedAt &&
          webviewPanel._issue.updatedAt.getTime() !== issue.updatedAt.getTime()
        ) {
          webviewPanel?.updateWebview(issue);
        }

        this._myIssues.set(issue.id, addKeyOnItem(issue, "issue"));
      });

      this._onDidChangeTreeData.fire();
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

    this._treeItems.set(item.id!, item);

    return item;
  }

  private _getWorkflowStateTreeItem(state: WorkflowStateWithStateProgress) {
    const issuesCount = Array.from(this._myIssues.values()).filter(
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

    this._treeItems.set(item.id!, item);

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

    this._treeItems.set(item.id!, item);

    return item;
  }

  private _tree = {
    getTeam: (): Team[] | WorkflowState[] | null => {
      const teams = Object.values(this._teams).filter((team) =>
        Array.from(this._myIssues.values()).some(
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
        Object.values(this._workflowStatesByTeam[teamId]),
      ) as unknown as WorkflowState[];
    },
    getIssue: (stateId: WorkflowState["id"]) => {
      const issue = Array.from(this._myIssues.values()).filter(
        // @ts-expect-error
        (issue) => issue._state.id === stateId,
      );
      return issue;
    },
  };
}

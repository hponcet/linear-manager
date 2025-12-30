import {
  Issue as LIssue,
  Team as LTeam,
  WorkflowState as LWorkflowState,
  LinearClient,
  User,
} from "@linear/sdk";
import { getLinearClient } from "../linear/auth";
import {
  ExtensionContext,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window,
  EventEmitter,
  TreeItemCollapsibleState,
  TreeDragAndDropController,
  DataTransfer,
  DataTransferItem,
} from "vscode";
import { Views } from "../constants";

export enum IssueState {
  Backlog = "backlog",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

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

  private linearClient: LinearClient;
  private me: User | null = null;
  private teams: Record<string, Team> = {};
  private workflowStatesByTeam: Record<string, Record<string, WorkflowState>> =
    {};
  private myIssues: Issue[] = [];

  private _autoRefreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.linearClient = getLinearClient() as LinearClient;
  }

  onDidChangeTreeData = this._onDidChangeTreeData.event;

  public async init(): Promise<void> {
    await this.getTeams();
    await this.getWorkflowStates();
    await this.getIssues();

    this.startAutoRefresh();
  }

  private startAutoRefresh() {
    if (this._autoRefreshInterval) {
      return;
    }
    this._autoRefreshInterval = setInterval(
      () => this.getIssues(),
      AUTO_REFRESH_INTERVAL_MS
    );
  }

  private async getMe() {
    if (this.me) {
      return this.me;
    }
    this.me = await this.linearClient.viewer;
    return this.me;
  }

  private async getTeams() {
    if (Object.keys(this.teams).length > 0) {
      return this.teams;
    }

    try {
      const viewer = await this.getMe();
      const teams = await viewer.teams({ first: 50 });
      this.teams = teams.nodes.reduce((acc, team) => {
        acc[team.id] = addKeyOnItem(team, "team");
        return acc;
      }, {} as Record<string, Team>);
      return this.teams;
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch user teams: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async getWorkflowStates() {
    try {
      const teams = await this.getTeams();

      for (const teamId in teams) {
        const workflowStates = await this.linearClient.workflowStates({
          filter: { team: { id: { eq: teamId } } },
        });

        this.workflowStatesByTeam[teamId] = workflowStates.nodes.reduce(
          (acc, state) => {
            acc[state.id] = addKeyOnItem(state, "workflowState");
            return acc;
          },
          {} as Record<string, WorkflowState>
        );
      }
      return this.workflowStatesByTeam;
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch assigned issues: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async getIssues() {
    try {
      const viewer = await this.getMe();
      const issues = await viewer.assignedIssues({ first: 250 });
      this.myIssues = issues.nodes.map((issue) => addKeyOnItem(issue, "issue"));
      this._onDidChangeTreeData.fire();
    } catch (error) {
      window.showErrorMessage(
        `Failed to fetch assigned issues: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private getTeamTreeItem(team: Team) {
    const item = new TreeItem(team.name, TreeItemCollapsibleState.Expanded);
    item.id = team.id;
    if (team.description) {
      item.description = team.description;
    }
    return item;
  }

  private getWorkflowStateTreeItem(state: WorkflowState) {
    const issuesCount = this.myIssues.filter(
      // @ts-expect-error
      (issue) => issue._state.id === state.id
    ).length;

    const item = new TreeItem(
      state.name,
      issuesCount
        ? TreeItemCollapsibleState.Expanded
        : TreeItemCollapsibleState.None
    );
    item.id = state.id;
    item.description = `${issuesCount}`;
    return item;
  }

  private getIssueTreeItem(issue: Issue) {
    const item = new TreeItem(
      `   ${issue.identifier}`,
      TreeItemCollapsibleState.None
    );
    item.id = issue.id;
    item.tooltip = issue.title;
    item.description = `- ${issue.title}`;
    return item;
  }

  private tree = {
    getTeam: (): Team[] | WorkflowState[] | null => {
      const teams = Object.values(this.teams).filter((team) =>
        // @ts-expect-error
        this.myIssues.some((issue) => issue._team.id === team.id)
      );

      if (teams.length === 0) {
        return null;
      }
      if (teams.length === 1) {
        return this.tree.getState(teams[0].id);
      }

      return teams;
    },
    getState: (teamId: Team["id"]): WorkflowState[] => {
      return Object.values(this.workflowStatesByTeam[teamId]).sort(
        (a, b) => a.position - b.position
      );
    },
    getIssue: (stateId: WorkflowState["id"]) => {
      // @ts-expect-error
      return this.myIssues.filter((issue) => issue._state.id === stateId);
    },
  };

  public getChildren(
    element?: Team | WorkflowState | Issue | undefined
  ): ProviderResult<Team[] | WorkflowState[] | Issue[]> {
    if (element?.__key === "team") {
      return this.tree.getState(element.id);
    }

    if (element?.__key === "workflowState") {
      return this.tree.getIssue(element.id);
    }

    if (!element) {
      return this.tree.getTeam();
    }

    return [];
  }

  public getTreeItem(element: Team | WorkflowState | Issue) {
    if (element.__key === "team") {
      return this.getTeamTreeItem(element);
    }
    if (element.__key === "workflowState") {
      return this.getWorkflowStateTreeItem(element);
    }

    return this.getIssueTreeItem(element);
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

    await this.linearClient.updateIssue(issue.id, {
      stateId: targetStateId,
    });

    await this.getIssues();
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

  public dispose() {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
      this._autoRefreshInterval = null;
    }
  }
}

export class LinearIssuesViewer {
  constructor(context: ExtensionContext) {
    const treeDataProvider = new LinearIssuesViewerProvider();
    context.subscriptions.push(
      window.createTreeView(Views.myIssues, {
        treeDataProvider,
        dragAndDropController: treeDataProvider,
        showCollapseAll: true,
      })
    );
    treeDataProvider.init();
  }
}

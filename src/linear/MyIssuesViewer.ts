import { Issue, LinearClient, User } from "@linear/sdk";
import { getLinearClient } from "./auth";
import {
  ExtensionContext,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window,
  EventEmitter,
  TreeItemCollapsibleState,
} from "vscode";
import { VSCodeTools } from "../vscodeTools/classWrapper";

  export enum IssueState {
  Backlog = "backlog",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export class LinearIssuesViewerProvider  extends VSCodeTools implements TreeDataProvider<Issue>  {
  private _onDidChangeIssue = new EventEmitter<Issue[]>();;


  private linearClient: LinearClient;
  public me: User | null = null;
  public myIssues: Issue[] = [];

  constructor() {
    super();
    this.linearClient = getLinearClient() as LinearClient;
  }

   async getMe() {
    if (this.me) {
      return this.me;
    }
    return new Promise<User>((resolve, reject) => {
      this.linearClient.viewer
        .then((viewer) => {
          this.me = viewer;
          resolve(viewer);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async refresh(): Promise<void> {
    return this.singlePromiseWithProgress<void>(async () => {
      try {
        const viewer = await this.getMe();

        const issues = await viewer.assignedIssues({ first: 50 });
        this.myIssues = issues.nodes;
        this._onDidChangeIssue.fire(this.myIssues);
        console.log(this.myIssues);
      } catch (error) {
        window.showErrorMessage(
          `Failed to fetch assigned issues: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }, "Fetching assigned issues");
  }


  getTreeItem(issue: Issue) {
    console.log(issue);
    const item = new TreeItem(issue.title, TreeItemCollapsibleState.None);
    item.id = issue.id;
    if (issue.description) {
      item.description = issue.description;
    }
    return item;
  }
  
  getChildren(element?: Issue | undefined): ProviderResult<Issue[]> {
    console.log(element);
    return this.myIssues;
  }
}

export class LinearIssuesViewer {
  constructor(context: ExtensionContext) {
    const treeDataProvider = new LinearIssuesViewerProvider();
    context.subscriptions.push(
      window.createTreeView("linear-manager-my-issues", { treeDataProvider })
    );
    treeDataProvider.refresh();
  }
}

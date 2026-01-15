import { isAction } from "src/ipc/messaging";
import { AbstractWebview } from "./AbstractWebview";
import { ExtensionContext, ViewColumn } from "vscode";
import {
  FromWebviewActions,
  ToWebviewActions,
} from "src/types/WebviewActionMessage";
import { Issue, LinearClient } from "@linear/sdk";
import { getLinearClient, LinearSecretKeys } from "src/linear/auth";
import { Webviews } from "src/constants";
import { Controller } from "src/controller";
import { MyIssuesView } from "src/views/MyIssuesView";

export class IssueWebview extends AbstractWebview<"issue"> {
  private linearClient: LinearClient;
  _issue: Partial<Issue> | null = null;
  _issueActions: MyIssuesView["_issuesActions"];

  isLoading: boolean = false;

  public get title(): string {
    return this._issue
      ? `${this._issue.identifier} - ${this._issue.title}` || "Untitled Issue"
      : "Create new issue";
  }
  public get viewId(): string {
    return Webviews.issueWebview;
  }

  constructor(
    context: ExtensionContext,
    issueActions: MyIssuesView["_issuesActions"]
  ) {
    super(context);
    this._issueActions = issueActions;
    this.linearClient = getLinearClient() as LinearClient;
  }

  async create(issue: Issue, column?: ViewColumn) {
    this._issue = issue;
    await this._initialize(issue);
    const panel = await super.createOrShow(column);

    panel.iconPath = Controller.resources.icons.get("issue");

    return panel;
  }

  private async _initialize(issue: Partial<Issue>) {
    this._issue = issue;
    await this.refresh();
  }

  protected override postMessage(
    message: ToWebviewActions<"issue">
  ): Thenable<boolean> {
    if (this._panel === undefined) {
      return Promise.resolve(false);
    }
    return this._panel!.webview.postMessage(message);
  }

  protected override async onMessageReceived(
    msg: FromWebviewActions
  ): Promise<boolean> {
    if (await super.onMessageReceived(msg)) {
      return true;
    }

    if (isAction(msg)) {
      if (!this._issue?.id) {
        return false;
      }

      switch (msg.action) {
        case "updateIssue": {
          await this._issueActions.updateIssue(msg.issueId);
          return true;
        }
      }
    }

    return false;
  }

  public async updatePanel() {
    if (!this._panel || !this.linearClient) {
      this.dispose();
      return { issue: null };
    }

    if (this.isLoading || !this._issue?.id) {
      return { issue: this._issue };
    }

    this.isLoading = true;

    this.postMessage({ type: "updateIssue", payload: undefined });

    this._issue = await this.linearClient.issue(this._issue!.id!);
    this._panel.title = this.title;

    this.isLoading = false;

    return { issue: this._issue };
  }

  public updateWebview() {
    this.postMessage({ type: "updateIssue", payload: undefined });
  }

  public async refresh() {
    const { issue } = await this.updatePanel();

    return {
      issueId: issue?.id || null,
      linearAccessToken: await this._context.secrets.get(
        LinearSecretKeys.accessToken
      ),
    };
  }
}

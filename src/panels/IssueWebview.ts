import { isAction } from "src/ipc/messaging";
import { AbstractWebview } from "./AbstractWebview";
import { ExtensionContext, ViewColumn } from "vscode";
import {
  FromWebviewActions,
  ToWebviewActions,
} from "src/types/WebviewActionMessage";
import { Issue } from "@linear/sdk";
import { LinearSecretKeys } from "src/linear/auth";
import { Webviews } from "src/constants";
import { Controller } from "src/controller";
import { MyIssuesView } from "src/views/MyIssuesView";

export class IssueWebview extends AbstractWebview<"issue"> {
  _issue: Partial<Issue> | null = null;
  _issueActions: MyIssuesView["_issuesActions"];

  isLoading: boolean = false;

  constructor(
    context: ExtensionContext,
    issueActions: MyIssuesView["_issuesActions"]
  ) {
    super(context);
    this._issueActions = issueActions;
  }

  async open(issue: Issue, column?: ViewColumn) {
    this._issue = issue;
    const panel = await super.createOrShow(column);

    panel.iconPath = Controller.resources.icons.get("issue");

    return panel;
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
        case "openIssue": {
          await this._issueActions.openIssue(msg.issueId);
          return true;
        }
      }
    }

    return false;
  }

  public updateWebview(issue: Partial<Issue>) {
    if (issue) {
      this._issue = issue;
      this._setTitle();
    }

    if (this._propsSent) {
      this.postMessage({
        type: "updateIssue",
        payload: issue.updatedAt?.getTime(),
      });
    }
  }

  override onVisibilityChange(visible: boolean): void {
    if (visible) {
      console.log(this._issue?.identifier, "visible");
      this.postMessage({ type: "updateIssue", payload: undefined });
    } else {
      console.log(this._issue?.identifier, "not visible");
    }
  }

  public async getProps() {
    return {
      issueId: this._issue?.id || null,
      linearAccessToken: await this._context.secrets.get(
        LinearSecretKeys.accessToken
      ),
    };
  }

  public get title(): string {
    return this._issue
      ? `${this._issue.identifier} - ${this._issue.title}` || "Untitled Issue"
      : "Create new issue";
  }
  public get viewId(): string {
    return Webviews.issueWebview;
  }
}

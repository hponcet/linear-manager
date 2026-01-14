import { isAction } from "src/ipc/messaging";
import { AbstractWebview } from "./AbstractWebview";
import { ExtensionContext, ViewColumn } from "vscode";
import { IssueAction, IssueMessage } from "src/ipc/issueMessaging";
import { Issue, LinearClient } from "@linear/sdk";
import { getLinearClient, LinearSecretKeys } from "src/linear/auth";
import { Webviews } from "src/constants";
import { Controller } from "src/controller";

export class IssueWebview extends AbstractWebview<"issue"> {
  private linearClient: LinearClient;
  _issue: Partial<Issue> | null = null;

  isLoading: boolean = false;

  public get title(): string {
    return this._issue
      ? `${this._issue.identifier} - ${this._issue.title}` || "Untitled Issue"
      : "Create new issue";
  }
  public get viewId(): string {
    return Webviews.issueWebview;
  }

  constructor(context: ExtensionContext) {
    super(context);
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

  async updateFields() {
    if (this.isLoading || !this._issue?.id) {
      return {
        issue: this._issue,
      };
    }

    this.isLoading = true;
    this._issue = await this.linearClient.issue(this._issue!.id!);
    this.isLoading = false;

    return {
      issue: this._issue,
    };
  }

  onIssueUpdate(issue: Partial<Issue>) {
    this._issue = issue;
    this.postMessage({ type: "updateIssue", payload: this._issue });
  }

  protected override postMessage(message: IssueMessage): Thenable<boolean> {
    if (this._panel === undefined) {
      return Promise.resolve(false);
    }
    return this._panel!.webview.postMessage(message);
  }

  protected override async onMessageReceived(
    msg: IssueAction
  ): Promise<boolean> {
    if (!super.onMessageReceived(msg)) {
      if (isAction(msg)) {
        if (!this._issue?.id) {
          return false;
        }

        switch (msg.action) {
          case "updateIssue": {
            const { title, description } = msg.fields;
            this.onIssueUpdate(
              await this.linearClient.updateIssue(this._issue.id, {
                title,
                description,
              })
            );
            return true;
          }
          case "createIssue": {
            this.onIssueUpdate(await this.linearClient.createIssue(msg.fields));
            return true;
          }
          case "updateState": {
            if (!msg.stateId) {
              return false;
            }
            this.onIssueUpdate(
              await this.linearClient.updateIssue(this._issue.id, {
                stateId: msg.stateId,
              })
            );
            return true;
          }
        }
      }
    }

    return false;
  }

  public async refresh() {
    const { issue } = await this.updateFields();

    return {
      issueId: issue?.id || null,
      linearAccessToken: await this._context.secrets.get(
        LinearSecretKeys.accessToken
      ),
    };
  }
}

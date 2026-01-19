import { ExtensionContext, ViewColumn } from "vscode";
import { Issue } from "@linear/sdk";
import { LinearSecretKeys } from "src/linear/auth";
import { Webviews } from "src/constants";
import { Controller } from "src/controller";
import { MyIssuesView } from "src/views/MyIssuesView";
import { AbstractIssueWebview } from "./AbstractIssueWebview";

export class StartWorkWebview extends AbstractIssueWebview<"startWork"> {
  constructor(
    context: ExtensionContext,
    issueActions: MyIssuesView["_issuesActions"]
  ) {
    super(context, issueActions);
  }

  async open(issue: Issue, column?: ViewColumn) {
    this._issue = issue;
    const panel = await super.createOrShow(column);

    panel.iconPath = Controller.resources.icons.get("startWork");

    return panel;
  }
  public async getProps() {
    return {
      branches: await Controller.git.getBranches({ remote: true }),
      currentBranch: Controller.git.getCurrentBranch(),
      issueId: this._issue?.id || null,
      linearAccessToken: await this._context.secrets.get(
        LinearSecretKeys.accessToken
      ),
    };
  }

  public get title(): string {
    return this._issue
      ? `${this._issue.identifier} - ${this._issue.title}` || "Untitled Issue"
      : "Start working on issue...";
  }

  public get viewId(): string {
    return Webviews.startWorkWebview;
  }
}

import { Issue } from "@linear/sdk"
import { Webviews } from "src/constants"
import { Controller } from "src/controller"
import { LinearSecretKeys } from "src/linear/auth"
import { MyIssuesView } from "src/views/myIssues"
import { ExtensionContext, ViewColumn } from "vscode"

import { AbstractIssueWebview } from "./AbstractIssueWebview"

export class IssueWebview extends AbstractIssueWebview<"issue"> {
  constructor(context: ExtensionContext, issueActions: MyIssuesView["issuesActions"]) {
    super(context, issueActions)
  }

  async open(issue: Issue, column?: ViewColumn) {
    this.issue = issue
    const panel = await super.createOrShow(column)

    panel.iconPath = Controller.resources.icons.get("issue")

    return panel
  }

  public async getProps() {
    return {
      issueId: this.issue?.id || null,
      linearAccessToken: await this._context.secrets.get(LinearSecretKeys.accessToken),
    }
  }

  public get title(): string {
    return this.issue
      ? `${this.issue.identifier} - ${this.issue.title}` || "Untitled Issue"
      : "Create new issue"
  }
  public get viewId(): string {
    return Webviews.issueWebview
  }
}

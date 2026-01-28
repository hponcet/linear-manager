import { AbstractWebview, ReactWebview } from "./AbstractWebview";
import { ExtensionContext, ViewColumn, WebviewPanel } from "vscode";
import { Ipc, Props } from "src/types/ActionMessage";
import { Issue } from "@linear/sdk";
import { MyIssuesView } from "src/views/MyIssuesView";
import { Controller } from "src/controller";

export interface ReactIssueWebview<
  T extends keyof Props,
> extends ReactWebview<T> {
  open(
    issue: Partial<Issue>,
    column: ViewColumn,
    ...params: any[]
  ): Promise<WebviewPanel>;
}

export abstract class AbstractIssueWebview<T extends keyof Props>
  extends AbstractWebview<T>
  implements ReactIssueWebview<T> {
  _issue: Partial<Issue> | null = null;
  _issueActions: MyIssuesView["_issuesActions"];

  isLoading: boolean = false;

  abstract override open(
    issue: Partial<Issue>,
    column: ViewColumn,
    ...params: any[]
  ): Promise<WebviewPanel>;

  constructor(
    context: ExtensionContext,
    issueActions: MyIssuesView["_issuesActions"],
  ) {
    super(context);
    this._issueActions = issueActions;
  }

  override async onMessageReceived<T extends Ipc<"req">["type"]>(
    msg: Ipc<"req", T>,
  ): Promise<boolean> {
    if (await super.onMessageReceived(msg)) {
      return Promise.resolve(true);
    }

    try {
      switch (msg.type) {
        case "updateIssue": {
          await this._issueActions.updateIssue(msg.issueId);
          return this.postMessage(msg.type, void 0);
        }
        case "openIssue": {
          await this._issueActions.openIssue(msg.issueId);
          return this.postMessage(msg.type, void 0);
        }
        case "startWork": {
          await this._issueActions.startWork(msg.issueId);
          return this.postMessage(msg.type, void 0);
        }
        case "getGitStatus": {
          const gitStatus = await Controller.git.getGitStatus();
          return this.postMessage(msg.type, gitStatus);
        }
        case "getAllBranches": {
          const branches = await Controller.git.getBranches({ remote: true });
          return this.postMessage(msg.type, branches);
        }
        case "getCurrentBranch": {
          const branch = Controller.git.getCurrentBranch();
          return this.postMessage(msg.type, branch);
        }
        case "createBranch": {
          const branch = await Controller.git.createBranch(
            msg.branchName,
            msg.from,
          );
          return this.postMessage(msg.type, branch);
        }
        case "checkout": {
          await Controller.git.checkout(msg.branch);
          return this.postMessage(msg.type, void 0);
        }
        case "hasUncommittedChanges": {
          const hasChanges = await Controller.git.hasUncommittedChanges();
          return this.postMessage(msg.type, hasChanges);
        }
      }
    } catch (error) {
      return this.postMessage(
        msg.type,
        (error as Error).message || String(error) || "Unknown error",
        true,
      );
    }

    return Promise.resolve(false);
  }

  public override updateWebview(issue: Partial<Issue>) {
    if (issue) {
      this._issue = issue;
      this._setTitle();
    }

    if (this._propsSent) {
      this.postListenerMessage("updateIssue", issue.updatedAt?.getTime());
    }
  }

  override onVisibilityChange(visible: boolean): void {
    if (visible) {
      this.postListenerMessage("updateIssue", undefined);
    }
  }
}

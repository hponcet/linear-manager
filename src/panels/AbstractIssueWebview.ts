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
  implements ReactIssueWebview<T>
{
  issue: Partial<Issue> | null = null;
  protected issueActions: MyIssuesView["issuesActions"];

  isLoading: boolean = false;

  abstract override open(
    issue: Partial<Issue>,
    column: ViewColumn,
    ...params: any[]
  ): Promise<WebviewPanel>;

  constructor(
    context: ExtensionContext,
    issueActions: MyIssuesView["issuesActions"],
  ) {
    super(context);
    this.issueActions = issueActions;
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
          await this.issueActions.updateIssue(msg.issueId);
          return this.postMessage(msg.type, void 0, msg);
        }
        case "openIssue": {
          await this.issueActions.openIssue(msg.issueId);
          return this.postMessage(msg.type, void 0, msg);
        }
        case "openExternal": {
          if (!this.issue?.identifier) {
            throw new Error("Issue identifier is not available");
          }
          await this.issueActions.openIssueExternal(
            msg.issueIdentifier || this.issue.identifier,
          );
          return this.postMessage(msg.type, void 0, msg);
        }
        case "startWork": {
          await this.issueActions.startWork(msg.issueId);
          return this.postMessage(msg.type, void 0, msg);
        }
        case "getGitStatus": {
          const gitStatus = await Controller.git.getGitStatus();
          return this.postMessage(msg.type, gitStatus, msg);
        }
        case "getAllBranches": {
          const branches = await Controller.git.getBranches({ remote: true });
          return this.postMessage(msg.type, branches, msg);
        }
        case "getCurrentBranch": {
          const branch = Controller.git.getCurrentBranch();
          return this.postMessage(msg.type, branch, msg);
        }
        case "createBranch": {
          const branch = await Controller.git.createBranch(
            msg.branchName,
            msg.from,
          );
          return this.postMessage(msg.type, branch, msg);
        }
        case "checkout": {
          await Controller.git.checkout(msg.branch);
          return this.postMessage(msg.type, void 0, msg);
        }
        case "hasUncommittedChanges": {
          const hasChanges = await Controller.git.hasUncommittedChanges();
          return this.postMessage(msg.type, hasChanges, msg);
        }
      }
    } catch (error) {
      return this.postMessage(
        msg.type,
        (error as Error).message || String(error) || "Unknown error",
        msg,
        true,
      );
    }

    return Promise.resolve(false);
  }

  public override updateWebview(issue: Partial<Issue>) {
    if (issue) {
      this.issue = issue;
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

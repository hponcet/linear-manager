import { isAction } from "src/ipc/messaging";
import { AbstractWebview } from "./AbstractWebview";
import { ExtensionContext, ViewColumn, WebviewPanel } from "vscode";
import {
  FromWebviewActions,
  Props,
  ToWebviewActions,
} from "src/types/WebviewActionMessage";
import { Issue } from "@linear/sdk";
import { MyIssuesView } from "src/views/MyIssuesView";
import { Controller } from "src/controller";

type PType = keyof Props;

export interface ReactIssueWebview {
  open(
    issue: Partial<Issue>,
    column: ViewColumn,
    ...params: any[]
  ): Promise<WebviewPanel>;
}

export abstract class AbstractIssueWebview<P extends PType>
  extends AbstractWebview<PType>
  implements ReactIssueWebview
{
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
    issueActions: MyIssuesView["_issuesActions"]
  ) {
    super(context);
    this._issueActions = issueActions;
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
        case "startWork": {
          await this._issueActions.startWork(msg.issueId);
          return true;
        }
        case "getAllBranch": {
          const branches = await Controller.git.getBranches({ remote: true });
          this.postMessage({ type: "allBranchResult", payload: branches });
          return true;
        }
        case "createBranch": {
          try {
            await Controller.git.createBranch(msg.branchName, msg.from);
            this.postMessage({
              type: "createBranchResult",
              payload: undefined,
            });
          } catch (error) {
            this.postMessage({
              type: "createBranchError",
              payload:
                (error as Error).message || String(error) || "Unknown error",
            });
          }
          return true;
        }
        case "checkout": {
          try {
            await Controller.git.checkout(msg.branchName);
            this.postMessage({
              type: "checkoutResult",
              payload: undefined,
            });
          } catch (error) {
            this.postMessage({
              type: "checkoutError",
              payload:
                (error as Error).message || String(error) || "Unknown error",
            });
          }
          return true;
        }
        case "hasUncommittedChanges": {
          const hasChanges = await Controller.git.hasUncommittedChanges();
          this.postMessage({
            type: "hasUncommittedChangesResult",
            payload: hasChanges,
          });
          return true;
        }
      }
    }

    return false;
  }

  public override updateWebview(issue: Partial<Issue>) {
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
      this.postMessage({ type: "updateIssue", payload: undefined });
    }
  }
}

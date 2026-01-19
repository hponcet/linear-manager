import { ExtensionContext } from "vscode";
import { MyIssuesView } from "./views/MyIssuesView";
import { Resources } from "./resources";
import { GitClient } from "./git/GitClient";

export class Controller {
  static resources: Resources;
  static git = new GitClient();

  static async initialize(context: ExtensionContext) {
    await this.git.init();

    this.resources = new Resources(context);
    this._issueViewer = new MyIssuesView(context);
    await this._issueViewer.initialize(context);
  }

  private static _issueViewer: MyIssuesView;
  public static get issueViewer() {
    return this._issueViewer;
  }

  public static dispose() {
    this._issueViewer.dispose();
  }
}

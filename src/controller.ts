import { ExtensionContext } from "vscode";
import { MyIssuesView } from "./views/MyIssuesView";
import { Resources } from "./resources";
import { GitClient } from "./git/GitClient";
import { CommandContext, setCommandContext } from "./commandsContext";

export class Controller {
  static resources: Resources;
  static git = new GitClient(this.onGitStatusChange.bind(this));

  static async initialize(context: ExtensionContext) {
    await this.git.init();

    this.resources = new Resources(context);
    this._issueViewer = new MyIssuesView(context);
    await this._issueViewer.initialize(context);
  }

  static onGitStatusChange(gitStatus: { repoActive: boolean, apiActive: boolean }) {
    setCommandContext(CommandContext.gitExtensionLoaded, gitStatus.apiActive);
    this._issueViewer?.changeGitStatus(gitStatus);
  }

  private static _issueViewer: MyIssuesView;
  public static get issueViewer() {
    return this._issueViewer;
  }

  public static dispose() {
    this._issueViewer?.dispose();
  }
}

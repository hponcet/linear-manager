import { ExtensionContext } from "vscode";
import { LinearIssuesViewerProvider } from "./views/MyIssuesView";
import { Resources } from "./resources";

export class Controller {
  static resources: Resources;

  static async initialize(context: ExtensionContext) {
    this.resources = new Resources(context);
    this._issueViewer = new LinearIssuesViewerProvider(context);
    await this._issueViewer.initialize(context);
  }

  private static _issueViewer: LinearIssuesViewerProvider;
  public static get issueViewer() {
    return this._issueViewer;
  }

  public static dispose() {
    this._issueViewer.dispose();
  }
}

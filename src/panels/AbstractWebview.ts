import { Action, isAction, PropsAction } from "src/ipc/messaging";
import {
  Disposable,
  Event,
  EventEmitter,
  ExtensionContext,
  Uri,
  ViewColumn,
  WebviewPanel,
  window,
  WindowState,
} from "vscode";

import { makeid } from "src/utils/makeid";
import {
  ToWebviewActions,
  Props,
  PropsMessage,
} from "src/types/WebviewActionMessage";

export type ContextMenuCommandData = {
  action: string;
  data: Record<string, string | boolean>;
};

export interface ReactWebview<P extends Props[keyof Props]> extends Disposable {
  hide(): void;
  createOrShow(): void;
  onDidPanelDispose(): Event<void>;
  refresh(): Promise<P>;
  handleContextMenuCommand?({ action, data }: ContextMenuCommandData): void;
}

export abstract class AbstractWebview<K extends keyof Props>
  implements ReactWebview<Props[K]>
{
  private static readonly viewType = "webview";

  private _disposablePanel: Disposable | undefined;
  protected _panel: WebviewPanel | undefined;
  protected _context: ExtensionContext;
  private _onDidPanelDispose = new EventEmitter<void>();

  abstract get title(): string;
  abstract get viewId(): string;
  abstract refresh(): Promise<Props[K]>;

  constructor(context: ExtensionContext) {
    this._context = context;
  }

  public async createOrShow(column?: ViewColumn) {
    if (this._panel) {
      this._panel.reveal(ViewColumn.One);
      return this._panel;
    }

    this._panel = window.createWebviewPanel(
      AbstractWebview.viewType,
      this.title,
      column ? column : ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          Uri.joinPath(this._context.extensionUri, "dist"),
          Uri.joinPath(this._context.extensionUri, "resources"),
        ],
      }
    );

    this.getWebviewContent(this._panel);
    this._panel.title =
      this.title.length > 30 ? this.title.substring(0, 30) + "..." : this.title;

    this._disposablePanel = Disposable.from(
      this._panel,
      this._panel.onDidDispose(this.onPanelDisposed, this),
      window.onDidChangeWindowState(this.onWindowReceiveFocus, this)
    );

    this._panel.webview.onDidReceiveMessage(
      this.onMessageReceived,
      this,
      this._context.subscriptions
    );

    return this._panel;
  }

  private getWebviewContent(panel: WebviewPanel) {
    const scriptSrc = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, "dist", "main.js")
    );

    const styleSrc = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, "dist", "main.css")
    );

    const font = panel.webview.asWebviewUri(
      Uri.joinPath(
        this._context.extensionUri,
        "resources",
        "Inter-VariableFont.ttf"
      )
    );

    const fontItalic = panel.webview.asWebviewUri(
      Uri.joinPath(
        this._context.extensionUri,
        "resources",
        "Inter-Italic-VariableFont.ttf"
      )
    );

    const nonce = makeid(16);

    panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self' ${panel.webview.cspSource}; img-src 'self' https: data:; script-src ${panel.webview.cspSource} 'nonce-${nonce}'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src ${panel.webview.cspSource} data: https:; style-src-elem 'self' 'unsafe-inline' ${panel.webview.cspSource}; connect-src ${panel.webview.cspSource} https://*.linear.app ws://*.linear.app https://storage.googleapis.com;"
        />
       
        <meta id="webview" name="webview" content="${this.viewId}" />
        <link rel="stylesheet" type="text/css" href="${styleSrc}" nonce="${nonce}" />
        <style nonce="${nonce}">
          @font-face {
            font-family: "Inter Variable";
            src: url("${font}") format("truetype-variations");
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: "Inter Variable";
            src: url("${fontItalic}") format("truetype-variations");
            font-weight: 100 900;
            font-style: italic;
            font-display: swap;
          }
        </style>
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
        <script src="${scriptSrc}" nonce="${nonce}"></script>
      </body>
    </html>
    `;
  }

  onDidPanelDispose(): Event<void> {
    return this._onDidPanelDispose.event;
  }

  private onWindowReceiveFocus(windowState: WindowState) {
    if (windowState.focused && this.visible) {
      this.refresh();
    }
  }

  protected onPanelDisposed() {
    if (this._disposablePanel) {
      this._disposablePanel.dispose();
    }
    this._panel = undefined;
    this._onDidPanelDispose.fire();
  }

  get visible() {
    return this._panel === undefined ? false : this._panel.visible;
  }

  hide() {
    if (this._panel !== undefined) {
      this._panel.dispose();
    }
  }

  public dispose() {
    if (this._disposablePanel) {
      this._disposablePanel.dispose();
    }

    this._onDidPanelDispose.dispose();
  }

  protected postMessage(message: PropsMessage<K>): Thenable<boolean> {
    if (this._panel === undefined) {
      return Promise.resolve(false);
    }

    return this._panel!.webview.postMessage(message);
  }

  protected async onMessageReceived(
    a: PropsAction | Action | ToWebviewActions<K>
  ): Promise<boolean> {
    if (isAction(a)) {
      switch (a.action) {
        case "get-props": {
          const props = await this.refresh();
          this.postMessage({ type: "props", props });
          return true;
        }
      }
    }

    return false;
  }
}

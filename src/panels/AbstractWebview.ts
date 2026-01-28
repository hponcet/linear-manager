import {
  Disposable,
  env,
  Event,
  EventEmitter,
  ExtensionContext,
  Memento,
  Uri,
  ViewColumn,
  WebviewPanel,
  WebviewPanelOnDidChangeViewStateEvent,
  window,
} from "vscode";

import { makeid } from "src/utils/makeid";
import {
  Props,
  Ipc,
  IpcResponse,
  GlobalListenerMessage,
} from "src/types/ActionMessage";
import { IS_PRODUCTION } from "src/constants";

export type ContextMenuCommandData = {
  action: string;
  data: Record<string, string | boolean>;
};

export interface ReactWebview<K extends keyof Props> extends Disposable {
  hide(): void;
  open(...params: any[]): Promise<WebviewPanel>;
  onDidPanelDispose(): Event<void>;
  getProps(): Promise<Props[K]>;
  updateWebview(issue: any): void;
  onMessageReceived<T extends Ipc<"req">["type"]>(
    msg: Ipc<"req", T>,
  ): Promise<boolean>;
}

export abstract class AbstractWebview<
  K extends keyof Props,
> implements ReactWebview<K> {
  private static readonly viewType = "webview";

  private _visible: boolean = false;

  private _disposablePanel: Disposable | undefined;
  protected _panel: WebviewPanel | undefined;
  protected _context: ExtensionContext;
  private _onDidPanelDispose = new EventEmitter<void>();

  protected _propsSent: boolean = false;
  protected _storage: Memento;

  abstract get title(): string;
  abstract get viewId(): string;
  abstract getProps(): Promise<Props[K]>;
  abstract open(...params: any[]): Promise<WebviewPanel>;
  abstract onVisibilityChange(visible: boolean): void;
  abstract updateWebview(issue: any): void;

  constructor(context: ExtensionContext) {
    this._context = context;
    this._storage = context.globalState;
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
      },
    );

    this.getWebviewContent(this._panel);

    this._setTitle();

    this._disposablePanel = Disposable.from(
      this._panel,
      this._panel.onDidDispose(this.onPanelDisposed, this),
      this._panel.onDidChangeViewState(this.onViewStateChanged, this),
    );

    this._panel.webview.onDidReceiveMessage(
      this.onMessageReceived,
      this,
      this._context.subscriptions,
    );

    return this._panel;
  }

  protected _setTitle() {
    if (!this._panel || !this.title) {
      return;
    }
    this._panel.title =
      this.title.length > 30 ? this.title.substring(0, 30) + "..." : this.title;
  }

  private getWebviewContent(panel: WebviewPanel) {
    const scriptSrc = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, "dist", "main.js"),
    );

    const styleSrc = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, "dist", "main.css"),
    );

    const font = panel.webview.asWebviewUri(
      Uri.joinPath(
        this._context.extensionUri,
        "resources",
        "Inter-VariableFont.ttf",
      ),
    );

    const fontItalic = panel.webview.asWebviewUri(
      Uri.joinPath(
        this._context.extensionUri,
        "resources",
        "Inter-Italic-VariableFont.ttf",
      ),
    );

    const nonce = makeid(16);

    panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self' ${
            panel.webview.cspSource
          }; img-src 'self' https: data:; script-src ${
            IS_PRODUCTION
              ? `${panel.webview.cspSource} 'nonce-${nonce}'`
              : `${panel.webview.cspSource} 'unsafe-eval'`
          }; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src ${
            panel.webview.cspSource
          } data: https:; style-src-elem 'self' 'unsafe-inline' ${
            panel.webview.cspSource
          }; connect-src ${
            panel.webview.cspSource
          } https://*.linear.app ws://*.linear.app https://storage.googleapis.com https://cdn.jsdelivr.net/npm/emojibase-data@latest/en/data.json https://cdn.jsdelivr.net/npm/emojibase-data@latest/en/messages.json"
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
        <base href="${Uri.joinPath(
          this._context.extensionUri,
          "resources",
        ).toString()}/" />
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

  private onViewStateChanged(e: WebviewPanelOnDidChangeViewStateEvent) {
    if (e.webviewPanel.visible) {
      this._visible = true;
    } else {
      this._visible = false;
    }
    this.onVisibilityChange(this._visible);
  }

  protected onPanelDisposed() {
    if (this._disposablePanel) {
      this._disposablePanel.dispose();
    }
    this._panel = undefined;
    this._onDidPanelDispose.fire();
  }

  get visible() {
    return this._panel === undefined ? false : this._visible;
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

  public postListenerMessage<T extends GlobalListenerMessage["action"]>(
    action: T,
    payload: Extract<GlobalListenerMessage, { action: T }>["payload"],
  ): void {
    if (this._panel === undefined) {
      return;
    }
    this._panel!.webview.postMessage({ action, payload });
  }

  public postMessage<
    T extends Ipc<"req">["type"],
    E extends true | void = void,
  >(
    type: T,
    payload: E extends true ? string : IpcResponse<T>["payload"],
    error?: boolean,
  ): Thenable<boolean> {
    if (this._panel === undefined) {
      return Promise.resolve(false);
    }

    if (error) {
      return this._panel!.webview.postMessage({
        type: `${type}_error`,
        error: payload,
      });
    }

    return this._panel!.webview.postMessage({
      type: `${type}_response`,
      payload,
    });
  }

  async onMessageReceived<T extends Ipc<"req">["type"]>(
    msg: Ipc<"req", T>,
  ): Promise<boolean> {
    try {
      switch (msg.type) {
        case "closePanel": {
          this.dispose();
          return this.postMessage(msg.type, undefined);
        }
        case "openExternal": {
          env.openExternal(Uri.parse(msg.url));
          return this.postMessage(msg.type, undefined);
        }
        case "props": {
          this._propsSent = true;
          return this.postMessage(msg.type, await this.getProps());
        }
        case "getState": {
          const key = msg.key;
          const value = this._context.globalState.get(key);
          return this.postMessage(msg.type, value);
        }
        case "setState": {
          const { key, value, timestamp } = msg;
          await this._context.globalState.update(key, value);
          this.postListenerMessage("stateUpdate", { value, timestamp, key });
          return this.postMessage(msg.type, undefined);
        }
        default:
          return false;
      }
    } catch (error) {
      return this.postMessage(
        msg.type,
        error.message || String(error) || "Unknown error",
        true,
      );
    }
  }
}

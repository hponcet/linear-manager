import { Controller } from "src/controller"
import { Props, Ipc, IpcResponse, GlobalListenerMessage } from "src/types/ActionMessage"
import { makeid } from "src/utils/makeid"
import { parseAllowedExternalUrl } from "src/utils/parseAllowedExternalUrl"
import {
  IssueDescriptionDraftsVscState,
  updateIssueDescriptionDrafts,
  VscStateKeys,
} from "src/vscStates"
import {
  Disposable,
  env,
  Event,
  EventEmitter,
  ExtensionContext,
  ExtensionMode,
  Memento,
  Uri,
  ViewColumn,
  WebviewPanel,
  WebviewPanelOnDidChangeViewStateEvent,
  window,
} from "vscode"

export type ContextMenuCommandData = {
  action: string
  data: Record<string, string | boolean>
}

const stateWriteQueues = new Map<string, Promise<void>>()
const stateWriteTimestamps = new Map<string, number>()

export function getWebviewScriptPolicy(
  cspSource: string,
  nonce: string,
  extensionMode: ExtensionMode,
): string {
  return extensionMode === ExtensionMode.Production
    ? `${cspSource} 'nonce-${nonce}'`
    : `${cspSource} 'unsafe-eval'`
}

export function getWebviewAssetDirectory(extensionMode: ExtensionMode): string {
  return extensionMode === ExtensionMode.Production ? "dist" : "dist-webviews-dev"
}

export interface ReactWebview<K extends keyof Props> extends Disposable {
  hide(): void
  open(...params: any[]): Promise<WebviewPanel>
  onDidPanelDispose(): Event<void>
  getProps(): Promise<Props[K]>
  updateWebview(issue: any): void
  onMessageReceived<T extends Ipc<"req">["type"]>(msg: Ipc<"req", T>): Promise<boolean>
}

export abstract class AbstractWebview<K extends keyof Props> implements ReactWebview<K> {
  private static readonly viewType = "webview"

  private _visible: boolean = false

  private _panelSubscriptions: Disposable[] = []
  protected _panel: WebviewPanel | undefined
  protected _context: ExtensionContext
  private _onDidPanelDispose = new EventEmitter<void>()

  protected _propsSent: boolean = false
  protected _storage: Memento

  abstract get title(): string
  abstract get viewId(): string
  abstract getProps(): Promise<Props[K]>
  abstract open(...params: any[]): Promise<WebviewPanel>
  abstract onVisibilityChange(visible: boolean): void
  abstract updateWebview(issue: any): void

  constructor(context: ExtensionContext) {
    this._context = context
    this._storage = context.globalState
  }

  public async createOrShow(column?: ViewColumn) {
    if (this._panel) {
      this._panel.reveal(column ?? ViewColumn.Active)
      return this._panel
    }

    this._panel = window.createWebviewPanel(
      AbstractWebview.viewType,
      this.title,
      column ? column : ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          Uri.joinPath(
            this._context.extensionUri,
            getWebviewAssetDirectory(this._context.extensionMode),
          ),
          Uri.joinPath(this._context.extensionUri, "resources"),
        ],
      },
    )

    this._propsSent = false

    this.getWebviewContent(this._panel)

    this._setTitle()

    this._panelSubscriptions.push(
      this._panel.onDidDispose(this.onPanelDisposed, this),
      this._panel.onDidChangeViewState(this.onViewStateChanged, this),
      this._panel.webview.onDidReceiveMessage((message) => {
        void this.onMessageReceived(message)
      }),
    )

    return this._panel
  }

  protected _setTitle() {
    if (!this._panel || !this.title) {
      return
    }
    this._panel.title = this.title.length > 30 ? this.title.substring(0, 30) + "..." : this.title
  }

  private getWebviewContent(panel: WebviewPanel) {
    const assetDirectory = getWebviewAssetDirectory(this._context.extensionMode)
    const scriptSrc = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, assetDirectory, `${this.viewId}.js`),
    )

    const styleSrc = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, assetDirectory, `${this.viewId}.css`),
    )

    const font = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, "resources", "Inter-VariableFont.ttf"),
    )

    const fontItalic = panel.webview.asWebviewUri(
      Uri.joinPath(this._context.extensionUri, "resources", "Inter-Italic-VariableFont.ttf"),
    )

    const nonce = makeid(16)
    const styleLink =
      this._context.extensionMode === ExtensionMode.Production
        ? `<link rel="stylesheet" type="text/css" href="${styleSrc}" nonce="${nonce}" />`
        : ""

    panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self' ${
            panel.webview.cspSource
          } https://*.linear.app; img-src 'self' https: blob: data:; media-src 'self' ${
            panel.webview.cspSource
          } https://linear.app https://*.linear.app https://storage.googleapis.com https://www.youtube.com https://www.loom.com blob: data:; frame-src ${
            panel.webview.cspSource
          } https://www.youtube.com https://www.youtube-nocookie.com https://www.loom.com; script-src ${getWebviewScriptPolicy(
            panel.webview.cspSource,
            nonce,
            this._context.extensionMode,
          )} https://www.youtube.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src ${
            panel.webview.cspSource
          } data: https:; style-src-elem 'self' 'unsafe-inline' ${
            panel.webview.cspSource
          }; connect-src ${
            panel.webview.cspSource
          } https://linear.app https://*.linear.app ws://*.linear.app https://storage.googleapis.com https://cdn.jsdelivr.net/npm/emojibase-data@latest/en/data.json https://cdn.jsdelivr.net/npm/emojibase-data@latest/en/messages.json"
        />
       
        <meta id="webview" name="webview" content="${this.viewId}" />
        ${styleLink}
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
        <base href="${Uri.joinPath(this._context.extensionUri, "resources").toString()}/" />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
        <script src="${scriptSrc}" nonce="${nonce}"></script>
      </body>
    </html>
    `
  }

  onDidPanelDispose(): Event<void> {
    return this._onDidPanelDispose.event
  }

  private onViewStateChanged(e: WebviewPanelOnDidChangeViewStateEvent) {
    if (e.webviewPanel.visible) {
      this._visible = true
    } else {
      this._visible = false
    }
    this.onVisibilityChange(this._visible)
  }

  protected onPanelDisposed() {
    this._disposePanelSubscriptions()
    this._panel = undefined
    this._propsSent = false
    this._onDidPanelDispose.fire()
  }

  private _disposePanelSubscriptions() {
    for (const disposable of this._panelSubscriptions) {
      disposable.dispose()
    }
    this._panelSubscriptions = []
  }

  get visible() {
    return this._panel === undefined ? false : this._visible
  }

  hide() {
    if (this._panel !== undefined) {
      this._panel.dispose()
    }
  }

  public dispose() {
    if (this._panel) {
      this._panel.dispose()
    } else {
      this._disposePanelSubscriptions()
    }

    this._onDidPanelDispose.dispose()
  }

  public postListenerMessage<T extends GlobalListenerMessage["action"]>(
    action: T,
    payload: Extract<GlobalListenerMessage, { action: T }>["payload"],
  ): void {
    if (this._panel === undefined) {
      return
    }
    this._panel!.webview.postMessage({ action, payload })
  }

  public postMessage<T extends Ipc<"req">["type"], E extends true | void = void>(
    type: T,
    payload: E extends true ? string : IpcResponse<T>["payload"],
    msg: Ipc<"req", T>,
    error?: boolean,
  ): Thenable<boolean> {
    if (this._panel === undefined) {
      return Promise.resolve(false)
    }

    if (error) {
      return this._panel!.webview.postMessage({
        type: `${type}_error`,
        error: payload,
        _ipcReqId: msg._ipcReqId,
      })
    }

    return this._panel!.webview.postMessage({
      type: `${type}_response`,
      payload,
      _ipcReqId: msg._ipcReqId,
    })
  }

  async onMessageReceived<T extends Ipc<"req">["type"]>(msg: Ipc<"req", T>): Promise<boolean> {
    try {
      switch (msg.type) {
        case "closePanel": {
          this.dispose()
          return this.postMessage(msg.type, undefined, msg)
        }
        case "props": {
          this._propsSent = true
          return this.postMessage(msg.type, await this.getProps(), msg)
        }
        case "openExternalUrl": {
          const url = (msg as Ipc<"req", "openExternalUrl">).url
          await env.openExternal(Uri.parse(parseAllowedExternalUrl(url).toString()))
          return this.postMessage(msg.type, undefined, msg)
        }
        case "getState": {
          const key = msg.key
          const value = this._context.globalState.get(key)
          return this.postMessage(msg.type, { key, value }, msg)
        }
        case "getIssueDescriptionDraft": {
          const drafts = this._context.globalState.get<IssueDescriptionDraftsVscState>(
            VscStateKeys.issueDescriptionDrafts,
            {},
          )
          return this.postMessage(msg.type, drafts[msg.issueId], msg)
        }
        case "setIssueDescriptionDraft": {
          const key = VscStateKeys.issueDescriptionDrafts
          const previousWrite = stateWriteQueues.get(key) ?? Promise.resolve()
          const write = previousWrite
            .catch(() => undefined)
            .then(async () => {
              const drafts = this._context.globalState.get<IssueDescriptionDraftsVscState>(key, {})
              await this._context.globalState.update(
                key,
                updateIssueDescriptionDrafts(drafts, msg.issueId, msg.value),
              )
            })
          stateWriteQueues.set(key, write)
          try {
            await write
          } finally {
            if (stateWriteQueues.get(key) === write) stateWriteQueues.delete(key)
          }
          return this.postMessage(msg.type, undefined, msg)
        }
        case "setState": {
          const { key, value, timestamp } = msg
          const writeTimestamp = Math.max(
            Date.now(),
            (stateWriteTimestamps.get(key) ?? 0) + 1,
            Number.isFinite(timestamp) ? timestamp : 0,
          )
          stateWriteTimestamps.set(key, writeTimestamp)

          const previousWrite = stateWriteQueues.get(key) ?? Promise.resolve()
          const write = previousWrite
            .catch(() => undefined)
            .then(async () => {
              await this._context.globalState.update(key, value)

              if (key === VscStateKeys.branchesSettings) {
                await Controller.gitProviderService?.refreshAuthContext()
              }

              this.postListenerMessage("stateUpdate", { value, timestamp: writeTimestamp, key })
            })
          stateWriteQueues.set(key, write)
          try {
            await write
          } finally {
            if (stateWriteQueues.get(key) === write) stateWriteQueues.delete(key)
          }
          return this.postMessage(msg.type, undefined, msg)
        }
        default:
          return false
      }
    } catch (error) {
      return this.postMessage(
        msg.type,
        error.message || String(error) || "Unknown error",
        msg,
        true,
      )
    }
  }
}

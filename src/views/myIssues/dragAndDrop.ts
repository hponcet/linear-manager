import {
  DataTransfer,
  DataTransferItem,
  DocumentDropEdit,
  ExtensionContext,
  languages,
  Position,
  TextDocument,
  TextDocumentContentProvider,
  Uri,
  ViewColumn,
  window,
  workspace,
} from "vscode"

import { Issue, LINEAR_ISSUE_SCHEME, MIME_TYPE_ISSUE } from "./types"

export interface DragDropHandlers {
  openIssue: (issue: Issue, viewColumn?: ViewColumn) => Promise<void>
  getIssue: (issueId: string) => Issue | undefined
}

/**
 * Registers the DocumentDropEditProvider for drag & drop to the editor
 */
export function registerDropProvider(context: ExtensionContext, handlers: DragDropHandlers) {
  const dropProvider = languages.registerDocumentDropEditProvider(
    { pattern: "**/*" },
    {
      provideDocumentDropEdits: async (
        document: TextDocument,
        _position: Position,
        dataTransfer: DataTransfer,
      ): Promise<DocumentDropEdit | undefined> => {
        const uriList = dataTransfer.get("text/uri-list")

        if (uriList) {
          const uriString = await uriList.asString()

          if (uriString.startsWith(`${LINEAR_ISSUE_SCHEME}://`)) {
            const uri = Uri.parse(uriString)
            const issueId = uri.authority

            const issue = handlers.getIssue(issueId)
            if (issue) {
              const targetEditor = window.visibleTextEditors.find(
                (editor) => editor.document.uri.toString() === document.uri.toString(),
              )
              const viewColumn = targetEditor?.viewColumn ?? ViewColumn.Active
              await handlers.openIssue(issue, viewColumn)
            }
            return undefined
          }
        }
        return undefined
      },
    },
    {
      dropMimeTypes: ["text/uri-list"],
    },
  )

  context.subscriptions.push(dropProvider)
  return dropProvider
}

/**
 * Registers the TextDocumentContentProvider for the linear-issue scheme
 */
export function registerLinearIssueContentProvider(
  context: ExtensionContext,
  handlers: DragDropHandlers,
) {
  const linearIssueContentProvider: TextDocumentContentProvider = {
    provideTextDocumentContent: async (uri: Uri): Promise<string> => {
      const issueId = uri.authority
      const issue = handlers.getIssue(issueId)

      if (issue) {
        setTimeout(async () => {
          let targetViewColumn: ViewColumn | undefined
          let tabToClose: (typeof window.tabGroups.all)[0]["tabs"][0] | undefined

          for (const tabGroup of window.tabGroups.all) {
            for (const tab of tabGroup.tabs) {
              const tabInput = tab.input as { uri?: Uri } | undefined
              if (tabInput?.uri?.scheme === LINEAR_ISSUE_SCHEME) {
                targetViewColumn = tabGroup.viewColumn
                tabToClose = tab
                break
              }
            }
            if (tabToClose) break
          }

          await handlers.openIssue(issue, targetViewColumn)

          if (tabToClose) {
            await window.tabGroups.close(tabToClose)
          }
        }, 0)
      }

      return ""
    },
  }

  const disposable = workspace.registerTextDocumentContentProvider(
    LINEAR_ISSUE_SCHEME,
    linearIssueContentProvider,
  )
  context.subscriptions.push(disposable)

  return disposable
}

/**
 * Handles drag from the TreeView
 */
export function handleTreeDrag(
  source: (Issue | { __key: string })[],
  treeDataTransfer: DataTransfer,
) {
  const issues = source.filter((s) => s.__key === "issue") as Issue[]

  if (issues.length === 0) {
    return
  }

  issues.forEach((issue, index) => {
    treeDataTransfer.set(`${MIME_TYPE_ISSUE}_${index}`, new DataTransferItem(issue))
  })

  const firstIssue = issues[0]
  const issueUri = `${LINEAR_ISSUE_SCHEME}://${firstIssue.id}/${firstIssue.identifier}?t=${Date.now()}`
  treeDataTransfer.set("text/uri-list", new DataTransferItem(issueUri))
}

import { Memento, TreeItemCollapsibleState, TreeView, Disposable } from "vscode"

export type TreeViewExpansionOverrides = Record<string, boolean>

export function getDefaultWorkflowStateExpanded(stateType: string): boolean {
  return ["unstarted", "started"].includes(stateType)
}

export class TreeViewExpansionState {
  readonly #memento: Memento
  readonly #storageKey: string

  constructor(memento: Memento, storageKey: string) {
    this.#memento = memento
    this.#storageKey = storageKey
  }

  getCollapsibleState(
    id: string,
    defaultExpanded: boolean,
    hasChildren = true,
  ): TreeItemCollapsibleState {
    if (!hasChildren) {
      return TreeItemCollapsibleState.None
    }

    const overrides = this.#loadOverrides()
    if (id in overrides) {
      return overrides[id] ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
    }

    return defaultExpanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
  }

  setExpanded(id: string, expanded: boolean, defaultExpanded: boolean): void {
    const overrides = this.#loadOverrides()

    if (expanded === defaultExpanded) {
      delete overrides[id]
    } else {
      overrides[id] = expanded
    }

    void this.#memento.update(this.#storageKey, overrides)
  }

  bindTreeView<T>(
    treeView: TreeView<T>,
    options: {
      getElementId: (element: T) => string | undefined
      getDefaultExpanded: (element: T) => boolean
    },
  ): Disposable {
    const expandDisposable = treeView.onDidExpandElement((event) => {
      const id = options.getElementId(event.element)
      if (!id) {
        return
      }

      this.setExpanded(id, true, options.getDefaultExpanded(event.element))
    })

    const collapseDisposable = treeView.onDidCollapseElement((event) => {
      const id = options.getElementId(event.element)
      if (!id) {
        return
      }

      this.setExpanded(id, false, options.getDefaultExpanded(event.element))
    })

    return Disposable.from(expandDisposable, collapseDisposable)
  }

  #loadOverrides(): TreeViewExpansionOverrides {
    return this.#memento.get<TreeViewExpansionOverrides>(this.#storageKey, {})
  }
}

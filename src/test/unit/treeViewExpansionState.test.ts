import * as assert from "assert"

import { Memento, TreeItemCollapsibleState } from "vscode"

import {
  getDefaultWorkflowStateExpanded,
  TreeViewExpansionState,
} from "../../views/treeViewExpansionState"

function createMemento() {
  const values: Record<string, unknown> = {}

  return {
    values,
    keys(): readonly string[] {
      return Object.keys(values)
    },
    get<T>(key: string, defaultValue?: T): T | undefined {
      const value = values[key] as T | undefined
      return value === undefined ? defaultValue : value
    },
    update(key: string, value: unknown) {
      values[key] = value
    },
  } as Memento & { values: Record<string, unknown> }
}

suite("TreeViewExpansionState", () => {
  test("returns defaults when no overrides are stored", () => {
    const memento = createMemento()
    const state = new TreeViewExpansionState(memento, "tree.test")

    assert.strictEqual(state.getCollapsibleState("team-1", true), TreeItemCollapsibleState.Expanded)
    assert.strictEqual(
      state.getCollapsibleState("done-1", false),
      TreeItemCollapsibleState.Collapsed,
    )
  })

  test("persists user overrides and clears them when matching defaults", () => {
    const memento = createMemento()
    const state = new TreeViewExpansionState(memento, "tree.test")

    state.setExpanded("team-1", false, true)
    assert.strictEqual(
      state.getCollapsibleState("team-1", true),
      TreeItemCollapsibleState.Collapsed,
    )

    state.setExpanded("team-1", true, true)
    assert.strictEqual(state.getCollapsibleState("team-1", true), TreeItemCollapsibleState.Expanded)
    assert.deepStrictEqual(memento.values["tree.test"], {})
  })
})

suite("getDefaultWorkflowStateExpanded", () => {
  test("expands active workflow groups by default", () => {
    assert.strictEqual(getDefaultWorkflowStateExpanded("unstarted"), true)
    assert.strictEqual(getDefaultWorkflowStateExpanded("started"), true)
    assert.strictEqual(getDefaultWorkflowStateExpanded("completed"), false)
  })
})

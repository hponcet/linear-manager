import * as assert from "assert"

import { updateIssueDescriptionDrafts } from "../../vscStates"
import {
  createDescriptionAutosave,
  restoreDescriptionDraft,
} from "../../webviews/views/IssueWebview/descriptionAutosave"

suite("description autosave", () => {
  test("does not let an invalid local draft replace the saved Linear description", () => {
    assert.deepStrictEqual(restoreDescriptionDraft("Saved Linear description", "+++ \n\n+++"), {
      description: "Saved Linear description",
      rejectedDraft: "+++ \n\n+++",
    })
  })

  test("updates one persisted issue draft without replacing siblings", () => {
    const drafts = { "issue-a": "A", "issue-b": "B" }

    assert.deepStrictEqual(updateIssueDescriptionDrafts(drafts, "issue-a", "A2"), {
      "issue-a": "A2",
      "issue-b": "B",
    })
    assert.deepStrictEqual(updateIssueDescriptionDrafts(drafts, "issue-a", null), {
      "issue-b": "B",
    })
  })

  test("serializes saves and keeps only the latest pending value", async () => {
    const savedValues: string[] = []
    let releaseFirst: ((saved: boolean) => void) | undefined
    let activeSaves = 0
    let maximumActiveSaves = 0

    const autosave = createDescriptionAutosave(async (value) => {
      savedValues.push(value)
      activeSaves += 1
      maximumActiveSaves = Math.max(maximumActiveSaves, activeSaves)

      const saved =
        value === "first"
          ? await new Promise<boolean>((resolve) => {
              releaseFirst = resolve
            })
          : true

      activeSaves -= 1
      return saved
    })

    autosave.schedule("first")
    const flushing = autosave.flush()
    await Promise.resolve()
    autosave.schedule("outdated")
    autosave.schedule("latest")
    releaseFirst?.(true)
    await flushing

    assert.deepStrictEqual(savedValues, ["first", "latest"])
    assert.strictEqual(maximumActiveSaves, 1)
    autosave.dispose()
  })

  test("keeps a failed value for an explicit retry", async () => {
    const savedValues: string[] = []
    let succeeds = false
    const autosave = createDescriptionAutosave(async (value) => {
      savedValues.push(value)
      return succeeds
    })

    autosave.schedule("draft")
    await autosave.flush()
    succeeds = true
    await autosave.flush()

    assert.deepStrictEqual(savedValues, ["draft", "draft"])
    autosave.dispose()
  })

  test("drops pending work when the editor becomes invalid", async () => {
    const savedValues: string[] = []
    let release: (() => void) | undefined
    const autosave = createDescriptionAutosave(async (value) => {
      savedValues.push(value)
      if (value === "valid") {
        await new Promise<void>((resolve) => {
          release = resolve
        })
      }
      return true
    })

    autosave.schedule("valid")
    const flushing = autosave.flush()
    await Promise.resolve()
    autosave.schedule("invalid pending value")
    autosave.cancelScheduled()
    release?.()
    await flushing

    assert.deepStrictEqual(savedValues, ["valid"])
    autosave.dispose()
  })
})

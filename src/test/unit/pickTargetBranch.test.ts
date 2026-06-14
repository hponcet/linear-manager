import * as assert from "assert"

import { pickTargetBranch } from "../../git/pickTargetBranch"
import { RefType } from "../../types/GitAPI"

suite("pickTargetBranch", () => {
  test("excludes the source branch from quick pick items", async () => {
    const shownItems: string[] = []
    const selected = await pickTargetBranch(
      {
        sourceBranch: "feature/foo",
        branches: [
          { type: RefType.Head, name: "main", commit: "" },
          { type: RefType.Head, name: "feature/foo", commit: "" },
        ],
        defaultBranch: "main",
      },
      async (items) => {
        const resolvedItems = await Promise.resolve(items)
        shownItems.push(...resolvedItems.map((item) => item.label ?? ""))
        return resolvedItems.find((item) => item.label === "main")
      },
    )

    assert.deepStrictEqual(shownItems, ["main"])
    assert.strictEqual(selected, "main")
  })

  test("returns undefined when quick pick is cancelled", async () => {
    const selected = await pickTargetBranch(
      {
        sourceBranch: "feature/foo",
        branches: [{ type: RefType.Head, name: "main", commit: "" }],
      },
      async () => undefined,
    )

    assert.strictEqual(selected, undefined)
  })
})

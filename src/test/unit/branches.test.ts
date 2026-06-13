import * as assert from "assert"

import { Ref, RefType } from "../../types/GitAPI"
import { checkPossiblyExistingBranchName, validateBranchName } from "../../webviews/utils/branches"

function branch(name: string): Ref {
  return { type: RefType.Head, name }
}

suite("branches utils", () => {
  test("validateBranchName rejects missing name", () => {
    assert.throws(() => validateBranchName(undefined), /Branch name is required/)
  })

  test("validateBranchName rejects names with spaces", () => {
    assert.throws(() => validateBranchName("feature bad name"), /cannot contain spaces/)
  })

  test("validateBranchName rejects duplicate branch names", () => {
    assert.throws(
      () => validateBranchName("feature/eng-123", [branch("feature/eng-123")]),
      /already exists/,
    )
  })

  test("checkPossiblyExistingBranchName finds an exact branch match", () => {
    const existing = branch("feature/eng-123-fix-bug")
    const [matching, exactMatch] = checkPossiblyExistingBranchName(
      "feature/eng-123-fix-bug",
      "ENG-123",
      [existing],
    )

    assert.strictEqual(matching.length, 1)
    assert.strictEqual(exactMatch?.name, existing.name)
  })

  test("checkPossiblyExistingBranchName matches branches by issue number", () => {
    const related = branch("feature/eng-123-other-work")
    const [matching] = checkPossiblyExistingBranchName("feature/eng-123-new", "ENG-123", [related])

    assert.strictEqual(matching.length, 1)
    assert.strictEqual(matching[0].name, related.name)
  })
})

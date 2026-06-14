import * as assert from "assert"

import { Uri } from "vscode"

import { buildMultiDiffResources } from "../../git/openPullRequestMultiDiff"
import { Status } from "../../types/GitAPI"

suite("buildMultiDiffResources", () => {
  test("maps git changes to multi diff editor resources", () => {
    const fileUri = Uri.file("/repo/src/app.ts")
    const api = {
      toGitUri: (uri: Uri, ref: string) => uri.with({ query: ref }),
    }

    const resources = buildMultiDiffResources(
      api as never,
      [
        {
          uri: fileUri,
          originalUri: fileUri,
          renameUri: undefined,
          status: Status.MODIFIED,
        },
      ],
      "main",
      "feature/foo",
    )

    assert.strictEqual(resources.length, 1)
    assert.strictEqual(resources[0]?.originalUri.query, "main")
    assert.strictEqual(resources[0]?.modifiedUri.query, "feature/foo")
  })
})

import * as assert from "assert"

import { truncateDiffFiles, truncateRawDiff } from "../../mcp/gitMcpApi"

suite("gitMcpApi diff truncation", () => {
  test("truncateRawDiff keeps small diffs intact", () => {
    const diff = "+++ b/file.ts\n+change"
    assert.strictEqual(truncateRawDiff(diff), diff)
  })

  test("truncateRawDiff truncates large diffs", () => {
    const diff = "a".repeat(600_000)
    const truncated = truncateRawDiff(diff)
    assert.ok(truncated.length < diff.length)
    assert.match(truncated, /truncated/)
  })

  test("truncateDiffFiles limits file count and bytes", () => {
    const files = Array.from({ length: 60 }, (_, index) => ({
      path: `file-${index}.ts`,
      patch: "+line\n".repeat(100),
    }))

    const result = truncateDiffFiles(files)
    assert.match(result, /file-0.ts/)
    assert.match(result, /omitted/)
  })
})

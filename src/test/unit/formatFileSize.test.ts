import * as assert from "assert"

import { formatFileSize } from "../../webviews/components/Editor/markdownPlugins/FilePlugin/formatFileSize"

suite("formatFileSize", () => {
  test("labels byte counts with binary units", () => {
    assert.strictEqual(formatFileSize(0), "0 B")
    assert.strictEqual(formatFileSize(1023), "1023 B")
    assert.strictEqual(formatFileSize(1024), "1 KB")
    assert.strictEqual(formatFileSize(22014), "21.5 KB")
    assert.strictEqual(formatFileSize(5 * 1024 * 1024), "5 MB")
  })

  test("stops at the largest unit and rejects unusable input", () => {
    assert.strictEqual(formatFileSize(1024 ** 5), "1024 TB")
    assert.strictEqual(formatFileSize(-1), "")
    assert.strictEqual(formatFileSize(Number.NaN), "")
  })
})

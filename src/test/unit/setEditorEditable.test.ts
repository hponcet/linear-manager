import * as assert from "assert"

import { setEditorEditable } from "../../webviews/components/Editor/setEditorEditable"

suite("setEditorEditable", () => {
  test("changes editability without emitting a document update", () => {
    const calls: Array<[boolean, boolean | undefined]> = []
    const editor = {
      setEditable(editable: boolean, emitUpdate?: boolean) {
        calls.push([editable, emitUpdate])
      },
    }

    setEditorEditable(editor, false)

    assert.deepStrictEqual(calls, [[false, false]])
  })
})

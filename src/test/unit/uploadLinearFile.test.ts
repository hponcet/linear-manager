import * as assert from "assert"

import {
  MAX_LINEAR_FILE_SIZE,
  uploadFileToLinear,
} from "../../webviews/components/Editor/uploadLinearFile"

suite("uploadLinearFile", () => {
  test("rejects files larger than the webview boundary", async () => {
    const file = new File([new Uint8Array(1)], "large.bin", {
      type: "application/octet-stream",
    })
    Object.defineProperty(file, "size", { value: MAX_LINEAR_FILE_SIZE + 1 })

    await assert.rejects(
      uploadFileToLinear(file, {
        uploadLinearFile: async () => ({ assetUrl: "unused" }),
        cancelLinearFileUpload: async () => ({ cancelled: false }),
      }),
      /between 1 byte and 10 MB/,
    )
  })

  test("rejects promptly when an in-flight IPC upload is cancelled", async () => {
    const originalFileReader = globalThis.FileReader

    class MockFileReader {
      result: string | ArrayBuffer | null = null
      error: DOMException | null = null
      onerror: (() => void) | null = null
      onload: (() => void) | null = null

      readAsDataURL() {
        this.result = "data:application/octet-stream;base64,YQ=="
        queueMicrotask(() => this.onload?.())
      }
    }

    globalThis.FileReader = MockFileReader as unknown as typeof FileReader
    const controller = new AbortController()
    let markUploadStarted: (() => void) | undefined
    const uploadStarted = new Promise<void>((resolve) => {
      markUploadStarted = resolve
    })
    let cancelCalls = 0

    try {
      const upload = uploadFileToLinear(
        new File(["a"], "asset.bin", { type: "application/octet-stream" }),
        {
          uploadLinearFile: async () => {
            markUploadStarted?.()
            return new Promise(() => undefined)
          },
          cancelLinearFileUpload: async () => {
            cancelCalls += 1
            throw new Error("cancel IPC failed")
          },
        },
        undefined,
        controller.signal,
      )

      await uploadStarted
      controller.abort()
      await assert.rejects(upload, /cancelled/i)
      assert.strictEqual(cancelCalls, 1)
    } finally {
      globalThis.FileReader = originalFileReader
    }
  })
})

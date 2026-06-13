import * as assert from "assert"

import { formatLinearError } from "../../linear/formatLinearError"
import {
  getLinearApiErrorMessage,
  notifyLinearApiError,
  registerLinearApiErrorHandler,
} from "../../webviews/api/linearApiErrors"

suite("formatLinearError", () => {
  test("returns GraphQL error messages when present", () => {
    const error = Object.assign(new Error("Request failed"), {
      errors: [{ message: "Title is required" }, { message: "Team not found" }],
    })

    assert.strictEqual(formatLinearError(error), "Title is required\nTeam not found")
  })

  test("falls back to Error.message", () => {
    assert.strictEqual(formatLinearError(new Error("Something went wrong")), "Something went wrong")
  })

  test("getLinearApiErrorMessage prefixes operation label", () => {
    const message = getLinearApiErrorMessage(new Error("Invalid URL"), {
      operation: "createAttachment",
    })

    assert.strictEqual(message, "Failed to add attachment: Invalid URL")
  })

  test("notifyLinearApiError deduplicates identical messages within a short window", () => {
    const seen: string[] = []

    registerLinearApiErrorHandler((_error, context) => {
      seen.push(getLinearApiErrorMessage(_error, context))
    })

    notifyLinearApiError(new Error("Invalid URL"), { operation: "createAttachment" })
    notifyLinearApiError(new Error("Invalid URL"), { operation: "createAttachment" })

    assert.strictEqual(seen.length, 1)

    registerLinearApiErrorHandler(null)
  })
})

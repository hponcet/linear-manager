import * as assert from "assert"

import {
  buildBitbucketApiTokenAuthHeader,
  buildBitbucketOAuthAuthHeader,
  normalizeBitbucketApiToken,
} from "../../gitProviders/bitbucket/bitbucketAuth"

suite("bitbucketAuth", () => {
  test("builds Basic auth header from Atlassian email and API token", () => {
    const header = buildBitbucketApiTokenAuthHeader("dev@example.com", "ATATT123")
    const encoded = header.replace("Basic ", "")
    const decoded = Buffer.from(encoded, "base64").toString("utf8")
    assert.strictEqual(decoded, "dev@example.com:ATATT123")
  })

  test("builds Bearer auth header for OAuth access tokens", () => {
    assert.strictEqual(buildBitbucketOAuthAuthHeader(" oauth-token "), "Bearer oauth-token")
  })

  test("normalizes pasted API tokens by trimming whitespace", () => {
    assert.strictEqual(normalizeBitbucketApiToken("  ATATT\nabc  "), "ATATTabc")
  })
})

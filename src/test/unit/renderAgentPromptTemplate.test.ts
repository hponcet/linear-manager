import * as assert from "assert"

import { renderAgentPromptTemplate } from "../../cursor/renderAgentPromptTemplate"

suite("renderAgentPromptTemplate", () => {
  test("replaces placeholders with provided values", () => {
    const rendered = renderAgentPromptTemplate("Issue {{issueIdentifier}} in {{team}}", {
      issueIdentifier: "ENG-42",
      team: "Platform",
    })

    assert.strictEqual(rendered, "Issue ENG-42 in Platform")
  })

  test("collapses blank lines left by empty placeholders", () => {
    const rendered = renderAgentPromptTemplate("Before\n{{emptyBlock}}\nAfter", {
      emptyBlock: "",
    })

    assert.strictEqual(rendered, "Before\n\nAfter")
  })
})

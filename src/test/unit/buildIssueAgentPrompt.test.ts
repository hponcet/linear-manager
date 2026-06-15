import * as assert from "assert"

import { buildIssueAgentPrompt } from "../../cursor/buildIssueAgentPrompt"

suite("buildIssueAgentPrompt", () => {
  test("directs the agent to load the ticket via MCP and start implementation", () => {
    const prompt = buildIssueAgentPrompt("ENG-42")

    assert.match(prompt, /ENG-42/)
    assert.match(prompt, /Implement Linear issue ENG-42/)
    assert.match(prompt, /get_issue/)
    assert.match(prompt, /get_related_issues/)
    assert.match(prompt, /get_issue_comments/)
    assert.match(prompt, /Start implementation immediately/)
    assert.match(prompt, /Respond in English/)
    assert.doesNotMatch(prompt, /description:/i)
  })

  test("uses a custom template from settings", () => {
    const prompt = buildIssueAgentPrompt(
      "ENG-42",
      {
        issuePromptTemplate: "Build {{issueIdentifier}} now in {{editorLanguage}}.",
      },
      { editorLanguageLocale: "fr" },
    )

    assert.match(prompt, /Build ENG-42 now in/)
    assert.doesNotMatch(prompt, /\{\{editorLanguage\}\}/)
  })

  test("rejects empty identifiers", () => {
    assert.throws(() => buildIssueAgentPrompt("   "), /identifier is required/)
  })
})

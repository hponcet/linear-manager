import * as assert from "assert"

import { serializeLinearIssueTag } from "../../webviews/components/Editor/markdownPlugins/MentionPlugin/LinearUserTag"
import {
  getMentionSuggestionAttributes,
  getMentionSuggestionItems,
  MentionSearchResult,
} from "../../webviews/components/Editor/markdownPlugins/MentionPlugin/mentionSuggestions"

const localUser = {
  id: "user-1",
  displayName: "Ada",
  name: "Ada Lovelace",
  email: "ada@example.com",
  active: true,
  isMentionable: true,
  profileUrl: "https://linear.app/acme/profiles/ada",
}

suite("mention suggestions", () => {
  const options = {
    getUsers: () => [localUser],
    getWorkspaceUrlKey: () => "acme",
  }

  test("keeps generic search attributes and enriches matching users", async () => {
    const remoteItem: MentionSearchResult = {
      kind: "issue",
      id: "issue-1",
      label: "ENG-1",
      description: "First issue",
      resourceUrl: "https://linear.app/acme/issue/ENG-1/first-issue",
    }

    const items = await getMentionSuggestionItems("ENG-1", {
      ...options,
      searchMentions: async () => [remoteItem],
    })

    assert.deepStrictEqual(items, [remoteItem])
  })

  test("preserves the API issue UUID used by Linear issue tags", () => {
    const item: MentionSearchResult = {
      kind: "issue",
      id: "33333333-3333-4333-8333-333333333333",
      label: "EX-538",
      resourceUrl: "https://linear.app/example/issue/EX-538/example",
    }
    const attributes = getMentionSuggestionAttributes(item)

    assert.deepStrictEqual(attributes, { ...item, notify: false })
    assert.strictEqual(
      serializeLinearIssueTag(attributes),
      '<issue id="33333333-3333-4333-8333-333333333333" href="https://linear.app/example/issue/EX-538/example">EX-538</issue>',
    )
    assert.deepStrictEqual(
      getMentionSuggestionAttributes({
        ...item,
        kind: "project",
        label: "Example project",
        resourceUrl: "https://linear.app/example/project/example-project/overview",
      }),
      {
        kind: "project",
        id: "example-project",
        label: "example-project",
        resourceUrl: "https://linear.app/example/project/example-project/overview",
        notify: false,
      },
    )
  })

  test("falls back to local users when asynchronous search fails", async () => {
    const items = await getMentionSuggestionItems("Ada", {
      ...options,
      searchMentions: async () => {
        throw new Error("offline")
      },
    })

    assert.deepStrictEqual(items[0], {
      kind: "user",
      id: "user-1",
      label: "Ada",
      description: "ada@example.com",
      resourceUrl: "https://linear.app/acme/profiles/ada",
      user: localUser,
    })
  })
})

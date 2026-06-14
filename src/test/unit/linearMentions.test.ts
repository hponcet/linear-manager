import * as assert from "assert"

import { SerializedUser } from "../../types/SerializedLinear"
import {
  buildUserProfileUrl,
  editorMarkdownToLinearMarkdown,
  filterMentionableUsers,
  linearMarkdownToEditorMarkdown,
  parseLinearProfileUrl,
  parseWorkspaceUrlKeyFromIssueUrl,
} from "../../utils/linearMentions"

const users: SerializedUser[] = [
  {
    id: "user-julie",
    displayName: "julie",
    name: "Julie Martin",
    email: "julie@example.com",
    active: true,
    isMentionable: true,
    profileUrl: "https://linear.app/acme/profiles/julie",
  },
  {
    id: "user-hugues",
    displayName: "hugues",
    name: "Hugues Poncet",
    email: "hugues@example.com",
    active: true,
    isMe: true,
    isMentionable: true,
    profileUrl: "https://linear.app/acme/profiles/hugues",
  },
  {
    id: "user-bot",
    displayName: "bot",
    name: "Bot User",
    email: "bot@example.com",
    active: true,
    isMentionable: false,
  },
]

suite("linearMentions", () => {
  test("parseWorkspaceUrlKeyFromIssueUrl extracts the workspace slug", () => {
    assert.strictEqual(
      parseWorkspaceUrlKeyFromIssueUrl("https://linear.app/acme/issue/ENG-1/test"),
      "acme",
    )
  })

  test("buildUserProfileUrl prefers the serialized profile URL", () => {
    assert.strictEqual(
      buildUserProfileUrl("acme", users[0]),
      "https://linear.app/acme/profiles/julie",
    )
  })

  test("buildUserProfileUrl falls back to display name slug", () => {
    assert.strictEqual(
      buildUserProfileUrl("acme", {
        displayName: "julie",
      }),
      "https://linear.app/acme/profiles/julie",
    )
  })

  test("parseLinearProfileUrl extracts workspace and slug", () => {
    assert.deepStrictEqual(parseLinearProfileUrl("https://linear.app/acme/profiles/julie"), {
      workspaceUrlKey: "acme",
      slug: "julie",
    })
  })

  test("linearMarkdownToEditorMarkdown converts profile URLs to mention shortcodes", () => {
    const markdown = "Hey https://linear.app/acme/profiles/julie can you review this?"
    const converted = linearMarkdownToEditorMarkdown(markdown, users)

    assert.strictEqual(
      converted,
      'Hey @[id="user-julie" label="julie" profileUrl="https://linear.app/acme/profiles/julie"] can you review this?',
    )
  })

  test("editorMarkdownToLinearMarkdown converts mention shortcodes back to profile URLs", () => {
    const markdown =
      'Hey @[id="user-julie" label="julie" profileUrl="https://linear.app/acme/profiles/julie"] please review.'

    assert.strictEqual(
      editorMarkdownToLinearMarkdown(markdown),
      "Hey https://linear.app/acme/profiles/julie please review.",
    )
  })

  test("filterMentionableUsers matches display name prefixes and excludes non-mentionable users", () => {
    const results = filterMentionableUsers("jul", users)

    assert.deepStrictEqual(
      results.map((user) => user.id),
      ["user-julie"],
    )
  })

  test("filterMentionableUsers boosts the current user when query is empty", () => {
    const results = filterMentionableUsers("", users)

    assert.strictEqual(results[0]?.id, "user-hugues")
  })
})

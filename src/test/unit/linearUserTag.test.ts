import * as assert from "assert"

import { Markdown, MarkdownManager } from "@tiptap/markdown"
import { StarterKit } from "@tiptap/starter-kit"

import {
  LinearUserTagMention,
  parseLinearEntityTag,
  parseLinearIssueTag,
  parseLinearUserTag,
  serializeLinearEntityTag,
  serializeLinearIssueTag,
  serializeLinearUserTag,
} from "../../webviews/components/Editor/markdownPlugins/MentionPlugin/LinearUserTag"

import type { JSONContent, MarkdownToken } from "@tiptap/core"

const id = "11111111-1111-4111-8111-111111111111"
const label = "example.user"

function findTokens(tokens: MarkdownToken[], type: string): MarkdownToken[] {
  return tokens.flatMap((token) => [
    ...(token.type === type ? [token] : []),
    ...findTokens((token.tokens as MarkdownToken[] | undefined) ?? [], type),
  ])
}

function findNodes(node: JSONContent, type: string): JSONContent[] {
  return [
    ...(node.type === type ? [node] : []),
    ...(node.content?.flatMap((child) => findNodes(child, type)) ?? []),
  ]
}

suite("Linear user tags", () => {
  const manager = new MarkdownManager({
    extensions: [Markdown, StarterKit, LinearUserTagMention],
  })

  test("parses and serializes the observed notify variants", () => {
    for (const notify of [false, true]) {
      const source = `<user id="${id}"${notify ? " notify" : ""}>${label}</user>`

      assert.deepStrictEqual(parseLinearUserTag(source), {
        raw: source,
        id,
        label,
        notify,
      })
      assert.strictEqual(serializeLinearUserTag({ id, label, notify }), source)

      const document = manager.parse(source)
      const mention = findNodes(document, "mention")[0]
      assert.deepStrictEqual(
        {
          kind: mention.attrs?.kind,
          id: mention.attrs?.id,
          label: mention.attrs?.label,
          resourceUrl: mention.attrs?.resourceUrl,
          notify: mention.attrs?.notify,
        },
        { kind: "user", id, label, resourceUrl: null, notify },
      )
      assert.strictEqual(manager.serialize(document), source)
    }
  })

  test("keeps canonical Linear URL mentions working", () => {
    const source = "https://linear.app/acme/profiles/example"
    const document = manager.parse(source)

    assert.strictEqual(findNodes(document, "mention").length, 1)
    assert.strictEqual(manager.serialize(document), source)
  })

  test("round-trips the observed issue entity tag", () => {
    const source = `<issue id="${id}" href="https://linear.app/example/issue/EX-538/example">EX-538</issue>`

    assert.deepStrictEqual(parseLinearIssueTag(source), {
      raw: source,
      id,
      label: "EX-538",
      resourceUrl: "https://linear.app/example/issue/EX-538/example",
    })
    assert.strictEqual(
      serializeLinearIssueTag({
        id,
        label: "EX-538",
        resourceUrl: "https://linear.app/example/issue/EX-538/example",
      }),
      source,
    )

    const document = manager.parse(source)
    assert.strictEqual(findNodes(document, "mention")[0]?.attrs?.kind, "issue")
    assert.strictEqual(manager.serialize(document), source)
  })

  test("round-trips project and document entity tags", () => {
    for (const entity of [
      {
        kind: "project" as const,
        label: "Design System",
        resourceUrl: "https://linear.app/example/project/design-system-8760499fa1e2",
      },
      {
        kind: "document" as const,
        label: "Cahier de recette — compact",
        resourceUrl: "https://linear.app/example/document/cahier-baf30e3852b0",
      },
    ]) {
      const source = `<${entity.kind} id="${id}" href="${entity.resourceUrl}">${entity.label}</${entity.kind}>`

      assert.deepStrictEqual(parseLinearEntityTag(source), { raw: source, id, ...entity })
      assert.strictEqual(serializeLinearEntityTag({ id, ...entity }), source)

      const document = manager.parse(source)
      const mention = findNodes(document, "mention")[0]
      assert.strictEqual(mention?.attrs?.kind, entity.kind)
      assert.strictEqual(mention?.attrs?.label, entity.label)
      assert.strictEqual(manager.serialize(document), source)
    }
  })

  test("leaves malformed, arbitrary, and code-wrapped tags to the default lexer", () => {
    const unsupported = [
      `<user id="not-a-uuid">${label}</user>`,
      `<user id="${id}" notify="true">${label}</user>`,
      `<user id="${id}" role="admin">${label}</user>`,
      `<USER id="${id}">${label}</USER>`,
      `<user id="${id}"><strong>${label}</strong></user>`,
      `<user id="${id}"></user>`,
      `<user id="${id}">${label}`,
      `<issue id="${id}" href="command:workbench.action.closeWindow">EX-538</issue>`,
      `<issue id="${id}" href="https://linear.app/example/issue/EX-538/example">OTHER-1</issue>`,
      `<project id="${id}" href="https://linear.app/example/issue/EX-538/example">Design System</project>`,
      `<document id="${id}" href="https://linear.app/example/document/x">Doc</issue>`,
    ]

    for (const source of unsupported) {
      assert.strictEqual(parseLinearUserTag(source), null)
      const tokens = manager.instance.lexer(source) as MarkdownToken[]
      assert.strictEqual(findTokens(tokens, "linearMention").length, 0)
    }

    const code = manager.instance.lexer(`\`<user id="${id}">${label}</user>\``) as MarkdownToken[]
    assert.strictEqual(findTokens(code, "linearMention").length, 0)
    assert.strictEqual(findTokens(code, "codespan").length, 1)
  })
})

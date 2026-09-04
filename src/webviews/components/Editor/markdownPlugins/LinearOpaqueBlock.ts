import { Node } from "@tiptap/core"

import { parseLinearEmbedJson } from "../markdownEscaping"

import type { JSONContent, MarkdownToken } from "@tiptap/core"

export type LinearOpaqueBlockKind =
  | "figma"
  | "html-comment"
  | "legacy-superscript"
  | "placeholder-file"

export type ParsedLinearOpaqueBlock = {
  raw: string
  markdown: string
  kind: LinearOpaqueBlockKind
  label: string
  href: string | null
  superscript?: {
    before: string
    content: string
    after: string
  }
}

const commentPattern = /^(<!--[\s\S]*?-->)(?:\r?\n|$)/
const embedPattern =
  /^(<linear-embed node-type="(figma|file)">([^\r\n]*)<\/linear-embed>)(?:\r?\n|$)/
const legacySuperscriptPattern = /^((\\\[)<sup>([^\r\n]*(?:\r?\n)\\\[)<\/sup>([^\r\n]*))(?:\r?\n|$)/
const canonicalLegacySuperscriptPattern =
  /^((\[)<sup>([^\r\n]*(?:\r?\n)\[)<\/sup>([^\r\n]*))(?:\r?\n|$)/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? value : null
  } catch {
    return null
  }
}

function visibleText(value: string): string {
  return value.replaceAll("\\[", "[").replaceAll("\\]", "]")
}

export function parseLinearOpaqueBlock(source: string): ParsedLinearOpaqueBlock | null {
  const comment = commentPattern.exec(source)
  if (comment) {
    const content = comment[1].slice(4, -3).trim()
    return {
      raw: comment[0],
      markdown: comment[1],
      kind: "html-comment",
      label: content ? `HTML comment: ${content}` : "HTML comment",
      href: null,
    }
  }

  const embed = embedPattern.exec(source)
  if (embed) {
    let payload: unknown
    try {
      payload = parseLinearEmbedJson(embed[3])
    } catch {
      return null
    }

    if (!isRecord(payload)) return null

    if (embed[2] === "figma") {
      const title = [payload.title, payload.nodeName].find(
        (value): value is string => typeof value === "string" && Boolean(value.trim()),
      )
      return {
        raw: embed[0],
        markdown: embed[1],
        kind: "figma",
        label: title ? `Figma: ${title}` : "Figma embed",
        href: safeHref(payload.href),
      }
    }

    if (payload.href !== null || payload.name !== "") return null

    return {
      raw: embed[0],
      markdown: embed[1],
      kind: "placeholder-file",
      label: "Unavailable Linear file",
      href: null,
    }
  }

  const superscript =
    legacySuperscriptPattern.exec(source) ?? canonicalLegacySuperscriptPattern.exec(source)
  if (!superscript) return null

  const segments = {
    before: visibleText(superscript[2]),
    content: visibleText(superscript[3]),
    after: visibleText(superscript[4]),
  }
  return {
    raw: superscript[0],
    markdown: superscript[1],
    kind: "legacy-superscript",
    label: `Legacy superscript: ${segments.before}${segments.content}${segments.after}`,
    href: null,
    superscript: segments,
  }
}

export function findLinearOpaqueBlock(source: string): number {
  return source.search(/^(?:<!--|<linear-embed node-type="(?:figma|file)">|(?:\\\[|\[)<sup>)/m)
}

export function serializeLinearOpaqueBlock(value: unknown): string | null {
  if (!isRecord(value) || typeof value.markdown !== "string") return null

  const parsed = parseLinearOpaqueBlock(value.markdown)
  return parsed?.markdown === value.markdown && parsed.kind === value.kind ? parsed.markdown : null
}

function tokenAttributes(token: MarkdownToken) {
  return parseLinearOpaqueBlock(typeof token.markdown === "string" ? token.markdown : "")
}

export const LinearOpaqueBlock = Node.create({
  name: "linearOpaqueBlock",

  priority: 90,

  group: "block",

  atom: true,

  addAttributes() {
    return {
      markdown: { default: null, rendered: false },
      kind: { default: null, rendered: false },
      label: { default: null, rendered: false },
      href: { default: null, rendered: false },
    }
  },

  renderHTML({ node }) {
    const parsed = parseLinearOpaqueBlock(node.attrs.markdown ?? "")
    const attributes = {
      "data-linear-opaque-block": parsed?.kind ?? "invalid",
      "aria-label": parsed?.label ?? "Invalid Linear content",
      contenteditable: "false",
    }

    if (parsed?.kind === "figma" && parsed.href) {
      return [
        "a",
        {
          ...attributes,
          href: parsed.href,
          rel: "noopener noreferrer nofollow",
        },
        parsed.label,
      ]
    }

    if (parsed?.kind === "legacy-superscript" && parsed.superscript) {
      return [
        "div",
        attributes,
        parsed.superscript.before,
        ["sup", {}, parsed.superscript.content],
        parsed.superscript.after,
      ]
    }

    return ["div", { ...attributes, role: "note" }, parsed?.label ?? "Invalid Linear content"]
  },

  markdownTokenName: "linearOpaqueBlock",

  markdownTokenizer: {
    name: "linearOpaqueBlock",
    level: "block",
    start: findLinearOpaqueBlock,
    tokenize(source) {
      const block = parseLinearOpaqueBlock(source)
      return block ? { type: "linearOpaqueBlock", ...block } : undefined
    },
  },

  parseMarkdown(token: MarkdownToken, helpers) {
    const parsed = tokenAttributes(token)
    return parsed
      ? helpers.createNode("linearOpaqueBlock", {
          markdown: parsed.markdown,
          kind: parsed.kind,
          label: parsed.label,
          href: parsed.href,
        })
      : []
  },

  renderMarkdown(node: JSONContent) {
    return serializeLinearOpaqueBlock(node.attrs) ?? ""
  },
})

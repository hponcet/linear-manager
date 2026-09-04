import { Mention } from "@tiptap/extension-mention"

import type { MarkdownToken } from "@tiptap/core"

export type LinearMentionKind =
  | "user"
  | "issue"
  | "project"
  | "document"
  | "cycle"
  | "milestone"
  | "view"
  | "initiative"

export type LinearMentionAttributes = {
  kind: LinearMentionKind
  id: string
  label: string
  resourceUrl: string
  notify?: boolean
}

const routeKinds: Record<string, LinearMentionKind> = {
  profiles: "user",
  issue: "issue",
  project: "project",
  document: "document",
  cycle: "cycle",
  milestone: "milestone",
  "project-milestone": "milestone",
  view: "view",
  initiative: "initiative",
}

const linearUrlPattern = /https:\/\/linear\.app\/[^\s<>()[\]"'`]+/g
const trailingPunctuationPattern = /[.,;:!?]+$/

export function hasMentionBoundary(source: string, index: number): boolean {
  return index === 0 || /[\s([{<"'`‘“]/.test(source[index - 1])
}

export function parseLinearMentionUrl(resourceUrl: string): LinearMentionAttributes | null {
  let url: URL

  try {
    url = new URL(resourceUrl)
  } catch {
    return null
  }

  if (url.protocol !== "https:" || url.hostname !== "linear.app") {
    return null
  }

  const segments = url.pathname.split("/").filter(Boolean)
  const route = segments[1]
  const id = segments[2]

  if (!segments[0] || !route || !routeKinds[route] || !id) {
    return null
  }

  let label: string
  try {
    label = decodeURIComponent(id)
  } catch {
    return null
  }

  return {
    kind: routeKinds[route],
    id: label,
    label,
    resourceUrl,
  }
}

export function findLinearMention(
  source: string,
): { index: number; mention: LinearMentionAttributes } | null {
  linearUrlPattern.lastIndex = 0
  let match = linearUrlPattern.exec(source)

  while (match) {
    if (!hasMentionBoundary(source, match.index)) {
      match = linearUrlPattern.exec(source)
      continue
    }

    const resourceUrl = match[0].replace(trailingPunctuationPattern, "")
    const mention = parseLinearMentionUrl(resourceUrl)

    if (mention) {
      return { index: match.index, mention }
    }

    match = linearUrlPattern.exec(source)
  }

  return null
}

export function tokenizeLinearMention(
  source: string,
  tokens: MarkdownToken[],
): MarkdownToken | undefined {
  const match = findLinearMention(source)
  const previousRaw = tokens[tokens.length - 1]?.raw

  if (!match || match.index !== 0) {
    return undefined
  }

  if (typeof previousRaw === "string" && !hasMentionBoundary(previousRaw, previousRaw.length)) {
    return {
      type: "text",
      raw: match.mention.resourceUrl,
      text: match.mention.resourceUrl,
    }
  }

  return {
    type: "linearMention",
    raw: match.mention.resourceUrl,
    ...match.mention,
  }
}

export const LinearMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      kind: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-kind"),
        renderHTML: ({ kind }) => (kind ? { "data-kind": kind } : {}),
      },
      resourceUrl: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-resource-url"),
        renderHTML: ({ resourceUrl }) => (resourceUrl ? { "data-resource-url": resourceUrl } : {}),
      },
    }
  },

  markdownTokenName: "linearMention",

  markdownTokenizer: {
    name: "linearMention",
    level: "inline",
    start: (source) => findLinearMention(source)?.index ?? -1,
    tokenize(source, tokens) {
      return tokenizeLinearMention(source, tokens)
    },
  },

  parseMarkdown(token: MarkdownToken, helpers) {
    return helpers.createNode("mention", {
      kind: token.kind,
      id: token.id,
      label: token.label,
      resourceUrl: token.resourceUrl,
    })
  },

  renderMarkdown(node) {
    return typeof node.attrs?.resourceUrl === "string" ? node.attrs.resourceUrl : ""
  },
})

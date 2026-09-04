import {
  findLinearMention,
  LinearMention,
  LinearMentionKind,
  parseLinearMentionUrl,
  tokenizeLinearMention,
} from "./LinearMention"

import type { JSONContent, MarkdownToken } from "@tiptap/core"

export type LinearUserTagAttributes = {
  id: string
  label: string
  notify: boolean
}

export type ParsedLinearUserTag = LinearUserTagAttributes & {
  raw: string
}

export type LinearEntityTagKind = "issue" | "project" | "document"

export type LinearEntityTagAttributes = {
  kind: LinearEntityTagKind
  id: string
  label: string
  resourceUrl: string
}

export type ParsedLinearEntityTag = LinearEntityTagAttributes & {
  raw: string
}

/** Kept for the issue-only callers that predate project and document tags. */
export type LinearIssueTagAttributes = Omit<LinearEntityTagAttributes, "kind">
export type ParsedLinearIssueTag = LinearIssueTagAttributes & { raw: string }

const linearUserIdSource =
  "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
const linearUserLabelSource = "[^<>\\r\\n]*[^<>\\s][^<>\\r\\n]*"
const linearUserTagSource = `<user id="(${linearUserIdSource})"( notify)?>(${linearUserLabelSource})<\\/user>`
const linearUserTagAtStartPattern = new RegExp(`^${linearUserTagSource}`)
const linearUserTagPattern = new RegExp(linearUserTagSource)
const linearUserIdPattern = new RegExp(`^${linearUserIdSource}$`)
const linearUserLabelPattern = new RegExp(`^${linearUserLabelSource}$`)
const linearEntityTagSource = String.raw`<(issue|project|document) id="(${linearUserIdSource})" href="(https://linear\.app/[^"<>\r\n]+)">(${linearUserLabelSource})</\1>`
const linearEntityTagAtStartPattern = new RegExp(`^${linearEntityTagSource}`)
const linearEntityTagPattern = new RegExp(linearEntityTagSource)

export function parseLinearUserTag(source: string): ParsedLinearUserTag | null {
  const match = linearUserTagAtStartPattern.exec(source)

  return match
    ? {
        raw: match[0],
        id: match[1],
        label: match[3],
        notify: match[2] !== undefined,
      }
    : null
}

export function findLinearUserTag(source: string): number {
  return linearUserTagPattern.exec(source)?.index ?? -1
}

export function parseLinearEntityTag(source: string): ParsedLinearEntityTag | null {
  const match = linearEntityTagAtStartPattern.exec(source)
  if (!match) {
    return null
  }

  const kind = match[1] as LinearEntityTagKind
  const mention = parseLinearMentionUrl(match[3])

  // An issue tag repeats its identifier in the URL; a project or document URL carries a
  // slug instead, so only the resource kind can be checked there.
  if (mention?.kind !== kind || (kind === "issue" && mention.label !== match[4])) {
    return null
  }

  return { raw: match[0], kind, id: match[2], resourceUrl: mention.resourceUrl, label: match[4] }
}

export function findLinearEntityTag(source: string): number {
  return linearEntityTagPattern.exec(source)?.index ?? -1
}

export function parseLinearIssueTag(source: string): ParsedLinearIssueTag | null {
  const entity = parseLinearEntityTag(source)
  if (entity?.kind !== "issue") {
    return null
  }

  const { kind, ...issue } = entity
  return issue
}

export function findLinearIssueTag(source: string): number {
  return findLinearEntityTag(source)
}

export function serializeLinearUserTag(
  attributes: Partial<LinearUserTagAttributes>,
): string | null {
  const { id, label, notify = false } = attributes

  if (
    typeof id !== "string" ||
    !linearUserIdPattern.test(id) ||
    typeof label !== "string" ||
    !linearUserLabelPattern.test(label) ||
    typeof notify !== "boolean"
  ) {
    return null
  }

  return `<user id="${id}"${notify ? " notify" : ""}>${label}</user>`
}

export function serializeLinearEntityTag(
  attributes: Partial<LinearEntityTagAttributes>,
): string | null {
  const { kind, id, label, resourceUrl } = attributes
  const mention = typeof resourceUrl === "string" ? parseLinearMentionUrl(resourceUrl) : null

  return (kind === "issue" || kind === "project" || kind === "document") &&
    typeof id === "string" &&
    linearUserIdPattern.test(id) &&
    typeof label === "string" &&
    linearUserLabelPattern.test(label) &&
    mention?.kind === kind &&
    (kind !== "issue" || mention.label === label)
    ? `<${kind} id="${id}" href="${mention.resourceUrl}">${label}</${kind}>`
    : null
}

export function serializeLinearIssueTag(
  attributes: Partial<LinearIssueTagAttributes>,
): string | null {
  return serializeLinearEntityTag({ ...attributes, kind: "issue" })
}

function firstIndex(...indices: number[]): number {
  const found = indices.filter((index) => index >= 0)
  return found.length ? Math.min(...found) : -1
}

export const LinearUserTagMention = LinearMention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      notify: {
        default: false,
        rendered: false,
      },
    }
  },

  markdownTokenizer: {
    name: "linearMention",
    level: "inline",
    start: (source) =>
      firstIndex(
        findLinearUserTag(source),
        findLinearEntityTag(source),
        findLinearMention(source)?.index ?? -1,
      ),
    tokenize(source, tokens) {
      const user = parseLinearUserTag(source)

      if (user) {
        return {
          type: "linearMention",
          raw: user.raw,
          kind: "user",
          id: user.id,
          label: user.label,
          resourceUrl: null,
          notify: user.notify,
        }
      }

      const entity = parseLinearEntityTag(source)
      if (entity) {
        return {
          type: "linearMention",
          ...entity,
          notify: false,
        }
      }

      return tokenizeLinearMention(source, tokens)
    },
  },

  parseMarkdown(token: MarkdownToken, helpers) {
    return helpers.createNode("mention", {
      kind: token.kind,
      id: token.id,
      label: token.label,
      resourceUrl: token.resourceUrl,
      notify: token.notify === true,
    })
  },

  renderMarkdown(node: JSONContent) {
    const kind = node.attrs?.kind as LinearMentionKind | undefined

    if (kind === "issue" || kind === "project" || kind === "document") {
      const entity = serializeLinearEntityTag({
        kind,
        id: node.attrs?.id,
        label: node.attrs?.label,
        resourceUrl: node.attrs?.resourceUrl,
      })
      if (entity) return entity
    }

    if (typeof node.attrs?.resourceUrl === "string" && node.attrs.resourceUrl) {
      return node.attrs.resourceUrl
    }

    if (kind !== "user") return ""

    return (
      serializeLinearUserTag({
        id: node.attrs?.id,
        label: node.attrs?.label,
        notify: node.attrs?.notify,
      }) ?? ""
    )
  },
})

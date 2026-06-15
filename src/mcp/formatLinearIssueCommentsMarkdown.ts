export type IssueCommentMarkdownEntry = {
  id: string
  body: string
  parentId?: string | null
  authorName?: string | null
  createdAt?: string | null
  resolvedAt?: string | null
}

export const MAX_ISSUE_COMMENTS = 100
export const MAX_COMMENT_BODY_CHARS = 10_000

function truncateBody(body: string): string {
  const trimmed = body.trim()
  if (trimmed.length <= MAX_COMMENT_BODY_CHARS) {
    return trimmed || "_Empty comment._"
  }

  return `${trimmed.slice(0, MAX_COMMENT_BODY_CHARS)}\n\n… truncated (${trimmed.length - MAX_COMMENT_BODY_CHARS} characters omitted)`
}

function formatCommentEntry(comment: IssueCommentMarkdownEntry, depth = 0): string[] {
  const indent = "  ".repeat(depth)
  const author = comment.authorName?.trim() || "Unknown author"
  const created = comment.createdAt?.trim()
  const header = created ? `${indent}### ${author} — ${created}` : `${indent}### ${author}`
  const lines = [header, ""]

  if (comment.resolvedAt) {
    lines.push(`${indent}_Resolved at ${comment.resolvedAt}_`, "")
  }

  const bodyLines = truncateBody(comment.body).split("\n")
  for (const line of bodyLines) {
    lines.push(`${indent}${line}`)
  }

  return lines
}

export function formatLinearIssueCommentsMarkdown(
  issueIdentifier: string,
  comments: IssueCommentMarkdownEntry[],
): string {
  const lines = [`# Comments for ${issueIdentifier}`, ""]

  if (comments.length === 0) {
    lines.push("_No comments._")
    return lines.join("\n")
  }

  const limited = comments.slice(0, MAX_ISSUE_COMMENTS)
  const byParent = new Map<string | null, IssueCommentMarkdownEntry[]>()

  for (const comment of limited) {
    const parentKey = comment.parentId ?? null
    const group = byParent.get(parentKey) ?? []
    group.push(comment)
    byParent.set(parentKey, group)
  }

  const sortByCreatedAt = (a: IssueCommentMarkdownEntry, b: IssueCommentMarkdownEntry): number => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
    return aTime - bTime
  }

  const renderThread = (comment: IssueCommentMarkdownEntry, depth: number): void => {
    lines.push(...formatCommentEntry(comment, depth))
    lines.push("")

    const replies = (byParent.get(comment.id) ?? []).sort(sortByCreatedAt)
    for (const reply of replies) {
      renderThread(reply, depth + 1)
    }
  }

  const roots = (byParent.get(null) ?? []).sort(sortByCreatedAt)
  for (const root of roots) {
    renderThread(root, 0)
  }

  if (comments.length > MAX_ISSUE_COMMENTS) {
    lines.push(
      `_… ${comments.length - MAX_ISSUE_COMMENTS} additional comments omitted (limit ${MAX_ISSUE_COMMENTS})._`,
    )
  }

  return lines.join("\n").trimEnd()
}

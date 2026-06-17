import { Comment, Issue, LinearClient } from "@linear/sdk"

import {
  formatLinearIssueCommentsMarkdown,
  IssueCommentMarkdownEntry,
} from "./formatLinearIssueCommentsMarkdown"
import { buildIssueMarkdownContext, formatLinearIssueMarkdown } from "./formatLinearIssueMarkdown"

import { fetchAllPreviousPages } from "../linear/pagination"

export function createLinearClientFromEnv(): LinearClient {
  const accessToken = process.env.LINEAR_ACCESS_TOKEN?.trim()
  if (!accessToken) {
    throw new Error("Linear is not connected. Connect your Linear account in Linear to Code.")
  }

  return new LinearClient({
    accessToken,
    headers: {
      "public-file-urls-expire-in": "60",
    },
  })
}

export async function resolveIssue(
  client: LinearClient,
  params: { id?: string; identifier?: string },
): Promise<Issue> {
  if (params.id?.trim()) {
    return client.issue(params.id.trim())
  }

  const identifier = params.identifier?.trim().toUpperCase()
  if (!identifier) {
    throw new Error("Provide either `id` or `identifier` (e.g. ENG-123).")
  }

  const result = await client.searchIssues(identifier)
  const match = result.nodes.find((node) => node.identifier?.toUpperCase() === identifier)
  if (!match) {
    throw new Error(`Issue ${identifier} was not found.`)
  }

  return client.issue(match.id)
}

export async function getIssueMarkdown(
  client: LinearClient,
  params: { id?: string; identifier?: string },
): Promise<string> {
  const issue = await resolveIssue(client, params)
  const context = await buildIssueMarkdownContext(issue)
  return formatLinearIssueMarkdown(issue, context)
}

async function toCommentMarkdownEntry(comment: Comment): Promise<IssueCommentMarkdownEntry> {
  const user = await comment.user
  const createdAt = comment.createdAt
  const resolvedAt = comment.resolvedAt

  return {
    id: comment.id,
    body: comment.body,
    parentId: comment.parentId ?? null,
    authorName: user?.displayName || user?.name || user?.email || null,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt ?? ""),
    resolvedAt:
      resolvedAt instanceof Date
        ? resolvedAt.toISOString()
        : resolvedAt
          ? String(resolvedAt)
          : null,
  }
}

export async function getIssueCommentsMarkdown(
  client: LinearClient,
  params: { id?: string; identifier?: string },
): Promise<string> {
  const issue = await resolveIssue(client, params)
  const commentsConnection = await issue.comments({ first: 100 })
  const comments = await fetchAllPreviousPages(commentsConnection)
  const entries = await Promise.all(comments.map((comment) => toCommentMarkdownEntry(comment)))
  return formatLinearIssueCommentsMarkdown(issue.identifier, entries)
}

export type RelatedIssuesResult = {
  issue: string
  parent: string | null
  siblings: string[]
  subIssues: string[]
}

export async function getRelatedIssuesMarkdown(
  client: LinearClient,
  params: { id?: string; identifier?: string },
): Promise<string> {
  const issue = await resolveIssue(client, params)
  const sections: string[] = [`# Related issues for ${issue.identifier}`, ""]

  sections.push("## Current issue")
  sections.push("")
  sections.push(await getIssueMarkdown(client, { id: issue.id }))

  const parent = await issue.parent
  if (parent) {
    sections.push("")
    sections.push("## Parent issue")
    sections.push("")
    sections.push(await getIssueMarkdown(client, { id: parent.id }))
  }

  const childrenConnection = await issue.children({ first: 100 })
  if (childrenConnection.nodes.length > 0) {
    sections.push("")
    sections.push("## Sub-issues")
    sections.push("")
    for (const child of childrenConnection.nodes) {
      sections.push(await getIssueMarkdown(client, { id: child.id }))
      sections.push("")
    }
  }

  if (parent) {
    const siblingsConnection = await parent.children({ first: 100 })
    const siblings = siblingsConnection.nodes.filter((node) => node.id !== issue.id)
    if (siblings.length > 0) {
      sections.push("## Sibling issues")
      sections.push("")
      for (const sibling of siblings) {
        sections.push(await getIssueMarkdown(client, { id: sibling.id }))
        sections.push("")
      }
    }
  }

  return sections.join("\n")
}

export async function listMyIssuesMarkdown(client: LinearClient): Promise<string> {
  const viewer = await client.viewer
  const issuesConnection = await viewer.assignedIssues({ first: 250 })
  const issues = issuesConnection.nodes

  if (issues.length === 0) {
    return "# My assigned issues\n\n_No assigned issues found._"
  }

  const lines = ["# My assigned issues", ""]
  for (const issue of issues) {
    const state = await issue.state
    lines.push(
      `- **${issue.identifier}** — ${issue.title} (${state?.name ?? "Unknown state"}) — ${issue.url}`,
    )
  }

  return lines.join("\n")
}

import { Issue, User } from "@linear/sdk"

export type IssueMarkdownContext = {
  stateName?: string | null
  assigneeName?: string | null
  teamName?: string | null
  labelNames?: string[]
}

export function formatLinearIssueMarkdown(
  issue: Issue,
  context: IssueMarkdownContext = {},
): string {
  const lines: string[] = [
    `# ${issue.identifier}: ${issue.title}`,
    "",
    `- **URL:** ${issue.url}`,
    `- **ID:** ${issue.id}`,
  ]

  if (context.stateName) {
    lines.push(`- **State:** ${context.stateName}`)
  }

  if (context.assigneeName) {
    lines.push(`- **Assignee:** ${context.assigneeName}`)
  }

  if (context.teamName) {
    lines.push(`- **Team:** ${context.teamName}`)
  }

  if (issue.priority !== undefined && issue.priority !== null) {
    lines.push(`- **Priority:** ${issue.priority}`)
  }

  if (context.labelNames && context.labelNames.length > 0) {
    lines.push(`- **Labels:** ${context.labelNames.join(", ")}`)
  }

  if (issue.parentId) {
    lines.push(`- **Parent ID:** ${issue.parentId}`)
  }

  lines.push("")
  lines.push("## Description")
  lines.push("")
  lines.push(issue.description?.trim() || "_No description._")

  return lines.join("\n")
}

function formatUserName(user: User | undefined | null): string | null {
  if (!user) {
    return null
  }

  return user.displayName || user.name || user.email || null
}

export async function buildIssueMarkdownContext(issue: Issue): Promise<IssueMarkdownContext> {
  const [state, assignee, team, labelsConnection] = await Promise.all([
    issue.state,
    issue.assignee,
    issue.team,
    issue.labels({ first: 50 }),
  ])

  return {
    stateName: state?.name ?? null,
    assigneeName: formatUserName(assignee),
    teamName: team?.name ?? null,
    labelNames: labelsConnection.nodes.map((label) => label.name).filter(Boolean),
  }
}

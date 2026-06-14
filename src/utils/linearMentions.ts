import { SerializedUser } from "src/types/SerializedLinear"

export const LINEAR_PROFILE_URL_PATTERN =
  /https:\/\/linear\.app\/([a-zA-Z0-9_-]+)\/profiles\/([^\s)\]>]+)/g

export type MentionableUser = Pick<
  SerializedUser,
  "id" | "displayName" | "name" | "email" | "profileUrl" | "active" | "isMe" | "isMentionable"
>

export function parseWorkspaceUrlKeyFromIssueUrl(issueUrl?: string): string | undefined {
  if (!issueUrl) {
    return undefined
  }

  const match = issueUrl.match(/^https:\/\/linear\.app\/([^/]+)\//)
  return match?.[1]
}

export function buildUserProfileUrl(
  workspaceUrlKey: string,
  user: Pick<SerializedUser, "displayName" | "profileUrl">,
): string {
  if (user.profileUrl) {
    return user.profileUrl
  }

  return `https://linear.app/${workspaceUrlKey}/profiles/${encodeURIComponent(user.displayName)}`
}

export function parseLinearProfileUrl(
  url: string,
): { workspaceUrlKey: string; slug: string } | null {
  const match = url.match(/^https:\/\/linear\.app\/([a-zA-Z0-9_-]+)\/profiles\/([^\s)\]>]+)$/)
  if (!match) {
    return null
  }

  return {
    workspaceUrlKey: match[1],
    slug: decodeURIComponent(match[2]),
  }
}

function parseMentionShortcodeAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const regex = /(\w+)=(?:"([^"]*)"|'([^']*)')/g
  let match = regex.exec(attrString)

  while (match !== null) {
    const [, key, doubleQuoted, singleQuoted] = match
    attrs[key] = doubleQuoted ?? singleQuoted ?? ""
    match = regex.exec(attrString)
  }

  return attrs
}

function findUserForProfileReference(
  reference: { workspaceUrlKey: string; slug: string; url: string },
  users: MentionableUser[],
): MentionableUser | undefined {
  return users.find((user) => {
    if (user.profileUrl === reference.url) {
      return true
    }

    if (user.profileUrl?.endsWith(`/profiles/${reference.slug}`)) {
      return true
    }

    return (
      user.displayName.toLowerCase() === reference.slug.toLowerCase() ||
      user.name.toLowerCase() === reference.slug.toLowerCase()
    )
  })
}

export function linearMarkdownToEditorMarkdown(markdown: string, users: MentionableUser[]): string {
  return markdown.replace(LINEAR_PROFILE_URL_PATTERN, (url) => {
    const parsed = parseLinearProfileUrl(url)
    if (!parsed) {
      return url
    }

    const user = findUserForProfileReference({ ...parsed, url }, users)
    if (!user) {
      return url
    }

    const profileUrl = user.profileUrl || url
    return `@[id="${user.id}" label="${user.displayName}" profileUrl="${profileUrl}"]`
  })
}

export function editorMarkdownToLinearMarkdown(markdown: string): string {
  return markdown.replace(/@\[(.*?)\]/g, (match, attrString: string) => {
    const attrs = parseMentionShortcodeAttributes(attrString)
    return attrs.profileUrl || match
  })
}

export function filterMentionableUsers(
  query: string,
  users: MentionableUser[],
  limit = 8,
): MentionableUser[] {
  const normalizedQuery = query.trim().toLowerCase()

  const mentionableUsers = users.filter(
    (user) => user.active !== false && user.isMentionable !== false,
  )

  const ranked = mentionableUsers
    .map((user) => {
      const haystack = [user.displayName, user.name, user.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (!normalizedQuery) {
        return { user, score: user.isMe ? 2 : 1 }
      }

      if (haystack === normalizedQuery) {
        return { user, score: 100 }
      }

      if (user.displayName.toLowerCase().startsWith(normalizedQuery)) {
        return { user, score: 80 }
      }

      if (user.name.toLowerCase().startsWith(normalizedQuery)) {
        return { user, score: 70 }
      }

      if (haystack.includes(normalizedQuery)) {
        return { user, score: 50 }
      }

      return null
    })
    .filter((entry): entry is { user: MentionableUser; score: number } => entry !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.user.displayName.localeCompare(right.user.displayName)
    })

  return ranked.slice(0, limit).map((entry) => entry.user)
}

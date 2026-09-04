import { SerializedUser } from "src/types/SerializedLinear"

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

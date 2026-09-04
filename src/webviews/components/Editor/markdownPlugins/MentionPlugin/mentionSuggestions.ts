import { SerializedWorkflowState } from "src/types/SerializedLinear"

import { LinearMentionAttributes, parseLinearMentionUrl } from "./LinearMention"

import {
  buildUserProfileUrl,
  filterMentionableUsers,
  MentionableUser,
} from "../../../../../utils/linearMentions"

export type MentionSearchResult = LinearMentionAttributes & {
  description?: string
  workflowState?: SerializedWorkflowState
}

export type MentionSuggestionItem = MentionSearchResult & {
  user?: MentionableUser
}

export type MentionSuggestionOptions = {
  getUsers: () => MentionableUser[]
  getWorkspaceUrlKey: () => string | undefined
  searchMentions?: (query: string) => Promise<MentionSearchResult[]>
}

export function getMentionSuggestionAttributes(item: MentionSuggestionItem) {
  const canonical = item.kind === "user" ? null : parseLinearMentionUrl(item.resourceUrl)

  if (canonical?.kind === item.kind && item.kind !== "issue") {
    return { ...canonical, notify: false }
  }

  return {
    kind: item.kind,
    id: item.id,
    label: item.label,
    resourceUrl: item.kind === "user" ? null : item.resourceUrl,
    notify: item.kind === "user",
  }
}

function localUserSuggestions(
  query: string,
  users: MentionableUser[],
  workspaceUrlKey?: string,
): MentionSuggestionItem[] {
  return filterMentionableUsers(query, users).flatMap((user) => {
    const resourceUrl =
      user.profileUrl || (workspaceUrlKey ? buildUserProfileUrl(workspaceUrlKey, user) : undefined)

    return resourceUrl
      ? [
          {
            kind: "user" as const,
            id: user.id,
            label: user.displayName,
            description: user.email || user.name,
            resourceUrl,
            user,
          },
        ]
      : []
  })
}

export async function getMentionSuggestionItems(
  query: string,
  options: MentionSuggestionOptions,
): Promise<MentionSuggestionItem[]> {
  const users = options.getUsers()
  const localItems = localUserSuggestions(query, users, options.getWorkspaceUrlKey())

  if (!options.searchMentions) {
    return localItems
  }

  try {
    const items = await options.searchMentions(query)
    return items.length
      ? items.map((item) => {
          const user = users.find((candidate) => candidate.id === item.id)
          return user ? { ...item, user } : item
        })
      : localItems
  } catch {
    return localItems
  }
}

import { IssueHistory as LinearHistory, User } from "@linear/sdk"
import { addKeyOnItem } from "src/utils/addKeyOnItem"

export type History = ReturnType<typeof addKeyOnItem<LinearHistory, "history">> & {
  actor: User | null
}

export function orderHistory(allHistory: LinearHistory[], users: User[]): History[] {
  return allHistory.map((history) => {
    let actor = users.find((u) => u.id === history.actorId) || null

    if (!actor) {
      actor = {
        id: "linear-bot",
        displayName: "Linear",
        email: "Linear",
      } as User
    }

    return {
      ...addKeyOnItem(history, "history"),
      id: history.id,
      actorId: history.actorId,
      actor,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
    } as unknown as History
  })
}

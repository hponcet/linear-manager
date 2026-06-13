import { SerializedIssueHistory, SerializedUser } from "src/types/SerializedLinear"
import { addKeyOnItem } from "src/utils/addKeyOnItem"

export type History = ReturnType<typeof addKeyOnItem<SerializedIssueHistory, "history">> & {
  actor: SerializedUser | null
  resolved?: SerializedIssueHistory["resolved"]
}

export function orderHistory(
  allHistory: SerializedIssueHistory[],
  users: SerializedUser[],
): History[] {
  return allHistory.map((history) => {
    let actor = users.find((u) => u.id === history.actorId) || null

    if (!actor) {
      actor = {
        id: "linear-bot",
        displayName: "Linear",
        email: "Linear",
        name: "Linear",
        active: true,
      }
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

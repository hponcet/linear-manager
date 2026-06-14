import { Issue } from "@linear/sdk"

export type IssueSyncPayload = {
  issueId: Issue["id"]
  updatedAt: number
  stateId?: string
  assigneeId?: string | null
  title?: string
  identifier?: string
  priority?: number
}

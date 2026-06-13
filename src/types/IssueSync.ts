import { Issue } from "@linear/sdk"

export type IssueSyncPayload = {
  issueId: Issue["id"]
  updatedAt: number
  stateId?: string
  title?: string
  identifier?: string
  priority?: number
}

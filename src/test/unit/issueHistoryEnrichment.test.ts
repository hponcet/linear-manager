import * as assert from "assert"

import { IssueHistory } from "@linear/sdk"

import {
  enrichIssueHistoryEntries,
  IssueHistoryEnrichmentContext,
} from "../../linear/issueHistoryEnrichment"

suite("issueHistoryEnrichment", () => {
  test("embeds resolved workflow states for history entries", () => {
    const entries = [
      {
        id: "history-1",
        actorId: "user-1",
        fromStateId: "state-1",
        toStateId: "state-2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as IssueHistory[]

    const enriched = enrichIssueHistoryEntries(entries, {
      teamMetadata: {
        labels: [],
        cycles: [],
        projects: [],
        workflowStates: [
          {
            id: "state-1",
            name: "Todo",
            color: "#000000",
            type: "unstarted",
            position: 0,
            stateProgress: 0,
            stateTypeLength: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "state-2",
            name: "Done",
            color: "#ffffff",
            type: "completed",
            position: 1,
            stateProgress: 1,
            stateTypeLength: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ] as IssueHistoryEnrichmentContext["teamMetadata"]["workflowStates"],
      },
      users: [],
      priorities: [],
    })

    assert.strictEqual(enriched[0]?.resolved?.fromState?.name, "Todo")
    assert.strictEqual(enriched[0]?.resolved?.toState?.name, "Done")
  })
})

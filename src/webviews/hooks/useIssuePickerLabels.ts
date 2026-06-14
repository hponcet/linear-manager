import { useMemo } from "react"
import {
  SerializedIssue,
  SerializedIssueLabel,
  SerializedTeamMetadata,
} from "src/types/SerializedLinear"

import { useAsyncMemo } from "./useAsyncMemo"

type UseIssuePickerLabelsParams = {
  issue: SerializedIssue | null | undefined
  getTeamMetadata: (teamId: string) => Promise<SerializedTeamMetadata>
  getProjectLabels: (projectId: string) => Promise<SerializedIssueLabel[]>
}

export function useIssuePickerLabels(params: UseIssuePickerLabelsParams) {
  const { issue, getTeamMetadata, getProjectLabels } = params

  const [teamMetadata, teamMetadataLoading] = useAsyncMemo(async () => {
    if (!issue?.teamId) {
      return null
    }
    return getTeamMetadata(issue.teamId)
  }, [issue?.teamId, getTeamMetadata])

  const [projectLabels, projectLabelsLoading] = useAsyncMemo(async () => {
    if (!issue?.projectId) {
      return null
    }
    return getProjectLabels(issue.projectId)
  }, [issue?.projectId, getProjectLabels])

  const issueLabels = useMemo((): SerializedIssueLabel[] => {
    if (issue?.projectId) {
      return projectLabels ?? []
    }
    return teamMetadata?.labels ?? []
  }, [issue?.projectId, projectLabels, teamMetadata?.labels])

  const teamLabels = useMemo(
    (): SerializedIssueLabel[] => teamMetadata?.labels ?? [],
    [teamMetadata?.labels],
  )

  const branchPrefixLabels = useMemo((): SerializedIssueLabel[] => {
    const byId = new Map<string, SerializedIssueLabel>()

    for (const label of teamLabels) {
      byId.set(label.id, label)
    }

    for (const label of issueLabels) {
      byId.set(label.id, label)
    }

    return Array.from(byId.values())
  }, [teamLabels, issueLabels])

  const issueLabelsLoading = issue?.projectId ? projectLabelsLoading : teamMetadataLoading

  return {
    teamMetadata,
    teamMetadataLoading,
    issueLabels,
    issueLabelsLoading,
    teamLabels,
    branchPrefixLabels,
  }
}

import { Issue } from "@linear/sdk"

import { BitbucketAuthMethod, GitProviderId } from "./gitProviders/types"
import { Ref } from "./types/GitAPI"

export enum VscStateKeys {
  issueSettings = "issueSettings",
  issueDescriptionDrafts = "issueDescriptionDrafts",
  branchesSettings = "branchesSettings",
  agentSettings = "agentSettings",
}

export type IssueLabelSetting = {
  color: string
  id: string
  name: string
}

export type IssueVscState = Record<
  Issue["id"],
  Partial<{
    branch: Ref
    branchInitialized: boolean
    ignoredBranches: string[]
  }>
>

export type IssueDescriptionDraftsVscState = Record<Issue["id"], string>

export function updateIssueDescriptionDrafts(
  drafts: IssueDescriptionDraftsVscState,
  issueId: string,
  value: string | null,
): IssueDescriptionDraftsVscState {
  const nextDrafts = { ...drafts }
  if (value === null) delete nextDrafts[issueId]
  else nextDrafts[issueId] = value
  return nextDrafts
}

export type SettingsVscState = {
  updateCycle?: boolean
  prefixByLabel?: boolean
  prefixByLabelList?: { label: IssueLabelSetting; prefix: string }[]
  uppercaseIssueIdentifier?: boolean
  stashBeforeCreate?: boolean
  gitProvider?: GitProviderId
  gitlabInstanceUrl?: string
  bitbucketAuthMethod?: BitbucketAuthMethod
  bitbucketAtlassianEmail?: string
  bitbucketOAuthClientId?: string
}

export type AgentSettingsVscState = {
  issuePromptTemplate?: string
  pullRequestReviewPromptTemplate?: string
}

export type { GitProviderId }

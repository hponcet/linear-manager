import {
  DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE,
  DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE,
} from "src/cursor/defaultAgentPrompts"
import { AgentSettingsVscState, VscStateKeys } from "src/vscStates"

import { useVSCState } from "./useVSCState"

const defaultAgentSettings: AgentSettingsVscState = {
  issuePromptTemplate: DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE,
  pullRequestReviewPromptTemplate: DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE,
}

export function useAgentSettings() {
  const [agentSettings, setAgentSettings, agentSettingsAreLoading] =
    useVSCState<AgentSettingsVscState>(VscStateKeys.agentSettings, defaultAgentSettings)

  function updateAgentSettings(value: Partial<AgentSettingsVscState>) {
    setAgentSettings((current) => ({ ...current, ...value }))
  }

  return { agentSettings, updateAgentSettings, agentSettingsAreLoading, defaultAgentSettings }
}

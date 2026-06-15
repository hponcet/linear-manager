import { AgentSettingsVscState, VscStateKeys } from "src/vscStates"
import { ExtensionContext } from "vscode"

import {
  DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE,
  DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE,
} from "./defaultAgentPrompts"

export const DEFAULT_AGENT_SETTINGS: AgentSettingsVscState = {
  issuePromptTemplate: DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE,
  pullRequestReviewPromptTemplate: DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE,
}

export function readAgentSettings(context: ExtensionContext): AgentSettingsVscState {
  const stored = context.globalState.get<AgentSettingsVscState>(VscStateKeys.agentSettings) ?? {}

  return {
    ...DEFAULT_AGENT_SETTINGS,
    ...stored,
  }
}

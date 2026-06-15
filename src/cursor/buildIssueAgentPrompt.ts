import { AgentSettingsVscState } from "src/vscStates"

import { DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE } from "./defaultAgentPrompts"
import { renderAgentPromptTemplate } from "./renderAgentPromptTemplate"
import { resolveEditorLanguage } from "./resolveEditorLanguage"

export type IssueAgentPromptOptions = {
  editorLanguageLocale?: string
}

export function buildIssueAgentPrompt(
  issueIdentifier: string,
  settings?: Pick<AgentSettingsVscState, "issuePromptTemplate">,
  options?: IssueAgentPromptOptions,
): string {
  const identifier = issueIdentifier.trim()
  if (!identifier) {
    throw new Error("Issue identifier is required to start work with the agent.")
  }

  const template = settings?.issuePromptTemplate?.trim() || DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE

  return renderAgentPromptTemplate(template, {
    issueIdentifier: identifier,
    editorLanguage: resolveEditorLanguage(options?.editorLanguageLocale),
  })
}

import { useEffect, useState } from "react"
import { PanelGroup } from "rsuite"
import {
  DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE,
  DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE,
  ISSUE_AGENT_PROMPT_PLACEHOLDERS,
  PULL_REQUEST_REVIEW_PROMPT_PLACEHOLDERS,
} from "src/cursor/defaultAgentPrompts"
import { useAgentSettings } from "src/webviews/hooks/useAgentSettings"
import { GitSettingsSection } from "src/webviews/views/StartWorkWebview/GitSettingsSection"

type PromptEditorProps = {
  label: string
  description: string
  placeholders: readonly string[]
  value: string
  onSave: (value: string) => void
  onReset: () => void
}

function PromptEditor(props: PromptEditorProps) {
  const { label, description, placeholders, value, onSave, onReset } = props
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <div className="git-settings-field agent-prompt-editor">
      <label className="git-settings-field__label">{label}</label>
      <p className="git-settings-field__hint">{description}</p>
      <div className="git-settings-control git-settings-control--textarea">
        <textarea
          value={draft}
          rows={14}
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (draft !== value) {
              onSave(draft)
            }
          }}
        />
      </div>
      <p className="git-settings-field__hint">Placeholders: {placeholders.join(", ")}</p>
      <button type="button" className="agent-prompt-editor__reset" onClick={onReset}>
        Reset to default
      </button>
    </div>
  )
}

export function SettingsAgentTab() {
  const { agentSettings, updateAgentSettings, agentSettingsAreLoading, defaultAgentSettings } =
    useAgentSettings()

  if (agentSettingsAreLoading) {
    return null
  }

  return (
    <PanelGroup className="settings-panel-group">
      <GitSettingsSection
        eventKey="start-work-with-agent"
        defaultExpanded
        title="Start work with agent"
        description="Prompt sent when you choose Start work with agent from the issue sidebar or after branch setup."
      >
        <PromptEditor
          label="Issue prompt template"
          description="The agent loads the ticket via MCP, then implements the changes in this workspace."
          placeholders={ISSUE_AGENT_PROMPT_PLACEHOLDERS}
          value={agentSettings.issuePromptTemplate ?? DEFAULT_ISSUE_AGENT_PROMPT_TEMPLATE}
          onSave={(issuePromptTemplate) => updateAgentSettings({ issuePromptTemplate })}
          onReset={() =>
            updateAgentSettings({
              issuePromptTemplate: defaultAgentSettings.issuePromptTemplate,
            })
          }
        />
      </GitSettingsSection>

      <GitSettingsSection
        eventKey="review-with-agent"
        title="Review with agent"
        description="Prompt sent when you review a pull request with the Cursor agent."
      >
        <PromptEditor
          label="Pull request review prompt template"
          description="Use placeholders for PR metadata and MCP instruction blocks."
          placeholders={PULL_REQUEST_REVIEW_PROMPT_PLACEHOLDERS}
          value={
            agentSettings.pullRequestReviewPromptTemplate ??
            DEFAULT_PULL_REQUEST_REVIEW_PROMPT_TEMPLATE
          }
          onSave={(pullRequestReviewPromptTemplate) =>
            updateAgentSettings({ pullRequestReviewPromptTemplate })
          }
          onReset={() =>
            updateAgentSettings({
              pullRequestReviewPromptTemplate: defaultAgentSettings.pullRequestReviewPromptTemplate,
            })
          }
        />
      </GitSettingsSection>
    </PanelGroup>
  )
}

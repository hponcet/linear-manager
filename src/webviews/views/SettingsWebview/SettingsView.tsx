import { Nav } from "rsuite"

import { SettingsAgentTab } from "./SettingsAgentTab"
import { SettingsGitTab } from "./SettingsGitTab"
import { SettingsWorkflowTab } from "./SettingsWorkflowTab"

import "./Settings.scss"

export type SettingsTab = "git" | "workflow" | "agent"

export const DEFAULT_SETTINGS_TAB: SettingsTab = "workflow"

type SettingsViewProps = {
  activeTab: SettingsTab
  onActiveTabChange: (tab: SettingsTab) => void
}

function renderSettingsTab(activeTab: SettingsTab) {
  switch (activeTab) {
    case "git":
      return <SettingsGitTab />
    case "workflow":
      return <SettingsWorkflowTab />
    case "agent":
      return <SettingsAgentTab />
    default:
      return <SettingsWorkflowTab />
  }
}

export function SettingsView(props: SettingsViewProps) {
  const { activeTab, onActiveTabChange } = props

  return (
    <div className="settings-view">
      <div className="settings-view__shell">
        <header className="settings-view__header">
          <h1 className="settings-view__title">Settings</h1>
        </header>
        <div className="settings-view__tabs">
          <Nav
            vertical
            appearance="tabs"
            activeKey={activeTab}
            onSelect={(key) => onActiveTabChange((key as SettingsTab) ?? DEFAULT_SETTINGS_TAB)}
          >
            <Nav.Item eventKey="workflow">Workflow</Nav.Item>
            <Nav.Item eventKey="git">Git</Nav.Item>
            <Nav.Item eventKey="agent">Work with agent</Nav.Item>
          </Nav>
          <div className="settings-view__tab-content">{renderSettingsTab(activeTab)}</div>
        </div>
      </div>
    </div>
  )
}

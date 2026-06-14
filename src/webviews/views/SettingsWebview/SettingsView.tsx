import { useEffect, useState } from "react"
import { Nav } from "rsuite"

import { SettingsGitTab } from "./SettingsGitTab"
import { SettingsWorkflowTab } from "./SettingsWorkflowTab"

import "./Settings.scss"

export type SettingsTab = "git" | "workflow"

type SettingsViewProps = {
  initialTab?: SettingsTab
}

export function SettingsView(props: SettingsViewProps) {
  const { initialTab } = props
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? "git")

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

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
            onSelect={(key) => setActiveTab((key as SettingsTab) ?? "git")}
          >
            <Nav.Item eventKey="git">Git</Nav.Item>
            <Nav.Item eventKey="workflow">Workflow</Nav.Item>
          </Nav>
          <div className="settings-view__tab-content">
            {activeTab === "git" ? <SettingsGitTab /> : <SettingsWorkflowTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

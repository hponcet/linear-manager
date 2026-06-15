import { ReactNode } from "react"
import { Panel } from "rsuite"

type GitSettingsSectionProps = {
  title: string
  description?: string
  children: ReactNode
  eventKey: string
  defaultExpanded?: boolean
}

export function GitSettingsSection(props: GitSettingsSectionProps) {
  const { title, description, children, eventKey, defaultExpanded = true } = props

  return (
    <Panel
      className="settings-section-panel"
      eventKey={eventKey}
      collapsible
      bordered={false}
      defaultExpanded={defaultExpanded}
      header={
        <div className="settings-section-panel__header">
          <h3 className="settings-section-panel__title">{title}</h3>
          {description ? (
            <p className="settings-section-panel__description">{description}</p>
          ) : null}
        </div>
      }
    >
      <div className="settings-section-panel__body">{children}</div>
    </Panel>
  )
}

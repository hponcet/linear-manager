import { ReactNode } from "react"

type GitSettingsSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

export function GitSettingsSection(props: GitSettingsSectionProps) {
  const { title, description, children } = props

  return (
    <section className="git-settings-section">
      <header className="git-settings-section__header">
        <h3 className="git-settings-section__title">{title}</h3>
        {description && <p className="git-settings-section__description">{description}</p>}
      </header>
      <div className="git-settings-section__body">{children}</div>
    </section>
  )
}

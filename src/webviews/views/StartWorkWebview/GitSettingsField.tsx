import { ReactNode } from "react"

type GitSettingsFieldProps = {
  label: string
  hint?: string
  /** Use monospace font for secrets and tokens. */
  mono?: boolean
  children: ReactNode
}

export function GitSettingsField(props: GitSettingsFieldProps) {
  const { label, hint, mono, children } = props

  return (
    <div className="git-settings-field">
      <label className="git-settings-field__label">{label}</label>
      <div className={`git-settings-control${mono ? " git-settings-control--mono" : ""}`}>
        {children}
      </div>
      {hint && <p className="git-settings-field__hint">{hint}</p>}
    </div>
  )
}

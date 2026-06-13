import { SerializedIssueLabel } from "src/types/SerializedLinear"

import "./Label.scss"

type LabelProps = {
  issueLabel?: SerializedIssueLabel | null
  inline?: boolean
  size?: number
}

export function Label(props: LabelProps) {
  const { issueLabel, inline, size } = props

  if (!issueLabel) {
    return null
  }

  if (inline) {
    return (
      <span is-inline="true" className="label" style={{ fontSize: size }}>
        <span
          className="labelColor"
          is-inline="true"
          style={{
            backgroundColor: issueLabel?.color,
            width: (size || 14) * 0.5,
            height: (size || 14) * 0.5,
            fontSize: size,
          }}
        />
        {issueLabel?.name}
      </span>
    )
  }

  return (
    <div is-inline="false" className="label" style={{ fontSize: size }}>
      <div
        className="labelColor"
        style={{
          backgroundColor: issueLabel?.color,
          width: (size || 14) * 0.5,
          height: (size || 14) * 0.5,
          fontSize: size,
        }}
      />
      {issueLabel?.name}
    </div>
  )
}

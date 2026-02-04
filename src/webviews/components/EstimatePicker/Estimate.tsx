import { EstimateDataItem } from "src/webviews/utils/issueEstimateByType"

import { EstimateIcon } from "./EstimateIcon"

export type PriorityProps = {
  style?: React.CSSProperties
  className?: string
  estimate?: EstimateDataItem | null
  inline?: "text" | "icon"
  size?: number
}

export function Estimate(props: PriorityProps) {
  const { style, className, estimate, inline, size } = props

  function getLabel() {
    if (!estimate?.inlineValue) {
      return <span>No estimate</span>
    } else if (typeof estimate?.inlineValue === "number" && inline !== "icon") {
      return (
        <>
          <span style={{ marginRight: 4 }}>{estimate?.inlineValue}</span>
          <span>Point{estimate?.inlineValue !== 1 ? "s" : ""}</span>
        </>
      )
    } else {
      return estimate?.inlineValue
    }
  }

  if (inline === "text") {
    return getLabel()
  } else if (inline === "icon") {
    return (
      <>
        <EstimateIcon
          estimate={estimate}
          style={{ marginRight: 6, ...style }}
          className={className}
          size={size}
        />
        {getLabel()}
      </>
    )
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        opacity: estimate?.value ? 1 : 0.3,
        fontSize: size,
        ...style,
      }}
    >
      <EstimateIcon
        estimate={estimate}
        style={{ marginRight: 8 }}
        className="estimateIcon"
        size={size}
      />
      {getLabel()}
    </div>
  )
}

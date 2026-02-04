import { Issue } from "@linear/sdk"
import { useMemo } from "react"
import { SelectPicker, type SelectPickerProps } from "rsuite"
import { useIssueContext } from "src/webviews/contexts/IssueContext"
import { EstimateDataItem } from "src/webviews/utils/issueEstimateByType"

import { Estimate } from "./Estimate"

import { Tooltip } from "../Tooltip/Tooltip"

import "./EstimatePicker.scss"

export type EstimatePickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange" | "size"
> & {
  issue: Issue
  inline?: "text" | "icon"
  size?: number
  onChange: (value: number | null) => void
}

export function EstimatePicker(props: EstimatePickerProps) {
  const { issue, style, className, inline, size, onChange, ...selectPickerProps } = props
  const { issueEstimations = [], issueEstimationsLoading } = useIssueContext()

  const data = useMemo(
    (): EstimateDataItem[] => [
      { label: "No estimate", value: "no-estimate", inlineValue: null },
      ...(issueEstimations || []),
    ],
    [issueEstimations],
  )

  if (!issueEstimations || issueEstimationsLoading || issueEstimations.length === 0) {
    return null
  }

  const estimate = issueEstimations.find((e) => e.value === issue.estimate) || null

  return (
    <Tooltip
      tooltip={inline === "icon" ? <Estimate estimate={estimate} /> : undefined}
      delayOpen={0}
    >
      <div className={`estimatePickerContainer ${className || ""}`} is-inline={inline}>
        <SelectPicker
          style={style}
          data={data}
          value={issue.estimate || null}
          onChange={(value) => onChange?.(value === "no-estimate" ? null : value)}
          placeholder={<Estimate estimate={null} inline={inline} size={size} />}
          cleanable={false}
          renderOption={(_, item) => <Estimate estimate={item as EstimateDataItem} />}
          renderValue={(_, item) =>
            item ? (
              <Estimate estimate={item as EstimateDataItem} inline={inline} size={size} />
            ) : null
          }
          {...selectPickerProps}
        />
      </div>
    </Tooltip>
  )
}

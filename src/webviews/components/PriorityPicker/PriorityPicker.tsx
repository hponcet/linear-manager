import { useMemo } from "react"
import { SelectPicker, type SelectPickerProps } from "rsuite"
import { SerializedIssue } from "src/types/SerializedLinear"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { Priority } from "./Priority"

import { Tooltip } from "../Tooltip/Tooltip"

export type PriorityPickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange" | "size"
> & {
  issue: SerializedIssue
  onChange: (value: number | null) => void
  inline?: "text" | "icon"
  size?: number
}

export function PriorityPicker(props: PriorityPickerProps) {
  const { issue, style, className, inline, size, onChange, ...selectPickerProps } = props
  const { priorities, prioritiesLoading } = useIssueContext()

  const data = useMemo(
    () =>
      priorities?.map((priority) => ({
        label: priority.label,
        value: priority.priority,
        priority,
      })) || [],
    [priorities],
  )

  const priority = data.find((p) => p.value === issue.priority)?.priority

  return (
    <Tooltip
      tooltip={inline === "icon" ? <Priority priority={priority} inline={null} /> : undefined}
      delayOpen={0}
    >
      <span>
        <SelectPicker
          loading={prioritiesLoading}
          data={data}
          style={style}
          className={className}
          value={issue.priority}
          onChange={onChange}
          renderOption={(_, item) => (
            <Priority priority={item.priority} style={{ marginRight: 8 }} />
          )}
          renderValue={(_, item) =>
            item ? (
              <Priority
                priority={item.priority}
                style={{ marginRight: 8 }}
                inline={inline}
                size={size}
              />
            ) : null
          }
          cleanable={false}
          {...selectPickerProps}
        />
      </span>
    </Tooltip>
  )
}

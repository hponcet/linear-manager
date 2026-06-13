import { useMemo } from "react"
import { SelectPicker, type SelectPickerProps } from "rsuite"
import { SerializedIssue } from "src/types/SerializedLinear"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { WorkflowState } from "./WorkflowState"

import { Tooltip } from "../Tooltip/Tooltip"

export type WorkflowStatePickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange" | "size"
> & {
  issue: SerializedIssue
  onChange: (value: string) => void
  inline?: "text" | "icon"
  size?: number
}

export function WorkflowStatePicker(props: WorkflowStatePickerProps) {
  const { style, className, issue, inline, size, onChange, ...selectPickerProps } = props
  const { workflowStates, workflowStatesLoading } = useIssueContext()

  const data = useMemo(
    () =>
      workflowStates?.map((workflowState) => ({
        label: workflowState.name,
        value: workflowState.id,
        workflowState,
      })) || [],
    [workflowStates],
  )

  const workflowState = data.find((state) => state.value === issue?.stateId)?.workflowState

  return (
    <Tooltip
      tooltip={
        inline === "icon" ? <WorkflowState workflowState={workflowState} size={size} /> : undefined
      }
      delayOpen={0}
    >
      <span>
        <SelectPicker
          loading={workflowStatesLoading}
          data={data}
          style={style}
          className={className}
          value={data.find((state) => state.value === issue?.stateId)?.value}
          onChange={onChange}
          renderOption={(_, item) => <WorkflowState workflowState={item.workflowState} />}
          renderValue={(_, item) => (
            <WorkflowState workflowState={item.workflowState} inline={inline} size={size} />
          )}
          cleanable={false}
          {...selectPickerProps}
        />
      </span>
    </Tooltip>
  )
}

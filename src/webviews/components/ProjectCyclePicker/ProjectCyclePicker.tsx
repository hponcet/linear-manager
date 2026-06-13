import { useMemo } from "react"
import { SelectPicker, type SelectPickerProps } from "rsuite"
import { SerializedCycle, SerializedIssue } from "src/types/SerializedLinear"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { ProjectCycle } from "./ProjectCycle"

import { Tooltip } from "../Tooltip/Tooltip"

export type ProjectCyclePickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange" | "size"
> & {
  issue: SerializedIssue
  onChange: (value: string | null) => void
  size?: number
  inline?: "text" | "icon"
}

export function ProjectCyclePicker(props: ProjectCyclePickerProps) {
  const { issue, style, className, inline, size, onChange, ...selectPickerProps } = props
  const { cycles, cyclesLoading } = useIssueContext()

  const data = useMemo(
    () => [
      {
        label: "No cycle",
        value: "no-cycle",
        cycle: null,
      },
      ...(cycles
        .map((cycle) => ({
          label: cycle.name || `Cycle ${cycle.number}`,
          value: cycle.id,
          cycle,
        }))
        .sort((a, b) => a.cycle.number - b.cycle.number) || []),
    ],
    [cycles],
  )

  const projectCycle = data.find((c) => c.value === issue.cycleId)?.cycle || null

  return (
    <Tooltip
      tooltip={
        inline === "icon" ? <ProjectCycle projectCycle={projectCycle} showDate /> : undefined
      }
      delayOpen={0}
    >
      <span>
        <SelectPicker
          loading={cyclesLoading}
          style={style}
          className={className}
          data={data}
          value={issue.cycleId || null}
          placeholder={<ProjectCycle projectCycle={null} inline={inline} />}
          onChange={(cycleId) => onChange?.(cycleId === "no-cycle" ? null : cycleId)}
          renderOption={(_, item: { cycle: SerializedCycle | null }) => (
            <ProjectCycle projectCycle={item.cycle} showDate />
          )}
          renderValue={(_, item) => {
            if (!item) {
              return null
            }
            return <ProjectCycle projectCycle={item.cycle} inline={inline} size={size} />
          }}
          {...selectPickerProps}
        />
      </span>
    </Tooltip>
  )
}

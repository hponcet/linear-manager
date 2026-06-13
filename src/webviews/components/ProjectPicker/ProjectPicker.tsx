import { useMemo } from "react"
import { SelectPicker, type SelectPickerProps } from "rsuite"
import { SerializedIssue } from "src/types/SerializedLinear"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { Project } from "./Project"

import { Tooltip } from "../Tooltip/Tooltip"

export type IssueProjectPickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange" | "size"
> & {
  issue: SerializedIssue
  inline?: "text" | "icon"
  size?: number
  onChange: (value: string | null) => void
}

export function IssueProjectPicker(props: IssueProjectPickerProps) {
  const { style, className, issue, inline, size, onChange, ...selectPickerProps } = props
  const { projects, projectsLoading } = useIssueContext()

  const data = useMemo(
    () => [
      {
        label: "No project",
        value: "no-project",
        project: null,
      },
      ...(projects
        ?.map((project) => ({
          label: project?.name,
          value: project?.id,
          project,
        }))
        .sort((a, b) => a.project?.name.localeCompare(b.project?.name)) || []),
    ],
    [projects],
  )

  const project = data?.find((p) => p?.value === issue.projectId)?.project || null

  return (
    <Tooltip tooltip={inline === "icon" ? <Project project={project} /> : undefined} delayOpen={0}>
      <div>
        <SelectPicker
          loading={projectsLoading}
          style={{ ...style, maxWidth: 300 }}
          className={className}
          data={data}
          value={issue.projectId || null}
          placeholder={<Project project={null} inline={inline} size={size} />}
          onChange={(projectId) => onChange?.(projectId === "no-project" ? null : projectId)}
          renderOption={(_, item) => <Project project={item.project} />}
          renderValue={(_, item) =>
            item ? <Project project={item.project} inline={inline} size={size} /> : null
          }
          {...selectPickerProps}
        />
      </div>
    </Tooltip>
  )
}

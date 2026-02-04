import { Issue } from "@linear/sdk"
import { useMemo } from "react"
import { SelectPicker, type SelectPickerProps } from "rsuite"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { Assignee } from "./Assignee"

import { Tooltip } from "../Tooltip/Tooltip"

export type AssigneePickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange" | "size"
> & {
  issue: Issue
  onChange: (value: string | null) => void
  inline?: "text" | "icon"
  size?: number
}

export function AssigneePicker(props: AssigneePickerProps) {
  const { issue, style, className, inline, size, onChange, ...selectPickerProps } = props
  const { users, usersLoading } = useIssueContext()

  const data = useMemo(
    () => [
      {
        label: "No assignee",
        value: null,
        user: null,
      },
      ...(users
        ?.map((user) => ({
          label: user.name,
          value: user.id,
          user,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .sort((a) => (a.user.isMe ? -1 : 1)) || []),
    ],
    [users],
  )

  const user = data.find((d) => d.value === issue.assigneeId)?.user

  return (
    <Tooltip tooltip={inline === "icon" ? <Assignee user={user} /> : undefined} delayOpen={0}>
      <span>
        <SelectPicker
          preventOverflow
          key={issue.assigneeId}
          loading={usersLoading}
          data={data}
          style={style}
          className={className}
          value={issue.assigneeId || undefined}
          onChange={(value) => onChange?.(value || null)}
          placeholder={<Assignee label="Assign" inline={inline} size={size} />}
          renderOption={(label, item) => (
            <Assignee style={{ width: "100%" }} label={label} user={item?.user} />
          )}
          renderValue={(value) => {
            const item = data.find((d) => d.value === value)

            if (!item?.value) return <Assignee label="Assign" inline={inline} />

            return <Assignee label={item?.label} user={item?.user} inline={inline} size={size} />
          }}
          cleanable={true}
          {...selectPickerProps}
        />
      </span>
    </Tooltip>
  )
}

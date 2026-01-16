import { useMemo } from "react";
import { SelectPicker, SelectPickerProps } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Priority } from "./Priority";
import { Issue } from "@linear/sdk";
import { Tooltip } from "../Tooltip/Tooltip";

export type PriorityPickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange"
> & {
  inline?: "text" | "icon";
  issue: Issue;
};

export function PriorityPicker(props: PriorityPickerProps) {
  const { issue, style, className, inline, ...selectPickerProps } = props;
  const { update, priorities, prioritiesLoading } = useIssueContext();

  const data = useMemo(
    () =>
      priorities?.map((priority) => ({
        label: priority.label,
        value: priority.priority,
        priority,
      })) || [],
    [priorities]
  );

  const priority = data.find((p) => p.value === issue.priority)?.priority;

  return (
    <Tooltip
      tooltip={
        inline === "icon" ? (
          <Priority priority={priority} inline={null} />
        ) : undefined
      }
      delayOpen={0}
    >
      <span>
        <SelectPicker
          loading={prioritiesLoading}
          data={data}
          style={style}
          className={className}
          value={issue.priority}
          onChange={async (value) =>
            update.issue(issue.id, { priority: value })
          }
          renderOption={(_, item) => (
            <Priority priority={item.priority} style={{ marginRight: 8 }} />
          )}
          renderValue={(_, item) =>
            item ? (
              <Priority
                priority={item.priority}
                style={{ marginRight: 8 }}
                inline={inline}
              />
            ) : null
          }
          cleanable={false}
          {...selectPickerProps}
        />
      </span>
    </Tooltip>
  );
}

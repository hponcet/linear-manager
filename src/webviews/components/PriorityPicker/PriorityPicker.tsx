import { useMemo } from "react";
import { SelectPicker } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Priority } from "./Priority";

export type PriorityPickerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function PriorityPicker(props: PriorityPickerProps) {
  const { style, className } = props;
  const { issue, update, priorities, prioritiesLoading } = useIssueContext();

  const data = useMemo(
    () =>
      priorities?.map((priority) => ({
        label: priority.label,
        value: priority.priority,
        priority,
      })) || [],
    [priorities]
  );

  return (
    <SelectPicker
      loading={prioritiesLoading}
      data={data}
      style={style}
      className={className}
      value={issue.priority}
      onChange={async (value) => update.issue({ priority: value })}
      renderOption={(_, item) => (
        <Priority priority={item.priority} style={{ marginRight: 8 }} />
      )}
      renderValue={(_, item) =>
        item ? (
          <Priority priority={item.priority} style={{ marginRight: 8 }} />
        ) : null
      }
      cleanable={false}
    />
  );
}

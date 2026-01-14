import { useMemo } from "react";
import { SelectPicker } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Assignee } from "./Assignee";

type AssigneePickerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function AssigneePicker(props: AssigneePickerProps) {
  const { style, className } = props;

  const { issue, update, users, usersLoading } = useIssueContext();

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
        .sort((a, b) => (a.user.isMe ? -1 : 1)) || []),
    ],
    [users]
  );

  return (
    <SelectPicker
      key={issue.assigneeId}
      loading={usersLoading}
      data={data}
      style={style}
      className={className}
      value={issue.assigneeId || undefined}
      onChange={(value) => update.issue({ assigneeId: value || null })}
      placeholder={<Assignee label="Assign" />}
      renderOption={(label, item) => (
        <Assignee style={{ width: "100%" }} label={label} user={item?.user} />
      )}
      renderValue={(value) => {
        const item = data.find((d) => d.value === value);

        if (!item?.value) return <Assignee label="Assign" />;

        return (
          <Assignee
            style={{ width: "100%" }}
            label={item?.label}
            user={item?.user}
          />
        );
      }}
      cleanable={true}
    />
  );
}

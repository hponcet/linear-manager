import { useMemo } from "react";
import { TagPicker, TagPickerProps } from "rsuite";
import { Issue } from "@linear/sdk";

import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Label } from "./Label";

import "./LabelsPicker.css";

type LabelsPickerProps = Omit<
  TagPickerProps,
  "onChange" | "value" | "data" | "size"
> & {
  issue: Issue;
  inline?: boolean;
  size?: number;
  onChange: (labelIds: string[]) => void;
  style?: React.CSSProperties;
  className?: string;
};

export function LabelsPicker(props: LabelsPickerProps) {
  const { issue, onChange, inline, size, style, className, ...tagPickerProps } =
    props;
  const { issueLabels, issueLabelsLoading } = useIssueContext();

  const cacheData = useMemo(
    () =>
      issueLabels
        ?.map((label) => ({
          label: label.name,
          value: label.id,
          issueLabel: label,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .sort((a, b) => (issue?.labelIds.includes(a.value) ? -1 : 1)) || [],
    [issueLabels, issue.labelIds]
  );

  return (
    <TagPicker
      virtualized
      style={style}
      className={`labelPicker ${className || ""}`}
      loading={issueLabelsLoading}
      data={cacheData}
      value={issue?.labelIds || []}
      onChange={(labelIds) => onChange(labelIds)}
      placeholder="No labels"
      cleanable={false}
      renderOption={(_, item) => (
        <Label key={item.value} issueLabel={item.issueLabel} inline />
      )}
      renderValue={(_, items) =>
        items.map((item) => {
          if (!item) return null;
          return (
            <Label
              key={item.value}
              issueLabel={item.issueLabel}
              inline={inline}
              size={size}
            />
          );
        })
      }
      {...tagPickerProps}
    />
  );
}

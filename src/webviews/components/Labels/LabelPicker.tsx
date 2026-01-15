import { useMemo } from "react";
import { TagPicker } from "rsuite";

import "./LabelPicker.css";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Label } from "./Label";

type LabelPickerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function LabelPicker(props: LabelPickerProps) {
  const { style, className } = props;
  const { issue, update, issueLabels, issueLabelsLoading } = useIssueContext();

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
      style={style}
      className={`labelPicker ${className || ""}`}
      loading={issueLabelsLoading}
      data={cacheData}
      value={issue?.labelIds || []}
      onChange={(labelIds) => update.issue({ labelIds })}
      placeholder="Add a labels..."
      cleanable={false}
      renderOption={(_, item) => (
        <Label key={item.value} issueLabel={item.issueLabel} inline />
      )}
      renderValue={(_, items) =>
        items.map((item) => {
          if (!item) return null;
          return <Label key={item.value} issueLabel={item.issueLabel} />;
        })
      }
    />
  );
}

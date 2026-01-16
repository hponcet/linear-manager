import { useMemo } from "react";
import { TagPicker } from "rsuite";
import { Issue } from "@linear/sdk";

import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Label } from "./Label";

import "./LabelsPicker.css";

type LabelsPickerProps = {
  style?: React.CSSProperties;
  className?: string;
  issue: Issue;
  inline?: boolean;
};

export function LabelsPicker(props: LabelsPickerProps) {
  const { issue, style, className, inline } = props;
  const { update, issueLabels, issueLabelsLoading } = useIssueContext();

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
      onChange={(labelIds) => update.issue(issue.id, { labelIds })}
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
            />
          );
        })
      }
    />
  );
}

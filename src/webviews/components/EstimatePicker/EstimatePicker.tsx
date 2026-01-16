import { SelectPicker, SelectPickerProps } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Estimate } from "./Estimate";
import { Issue } from "@linear/sdk";

import "./EstimatePicker.scss";
import { Tooltip } from "../Tooltip/Tooltip";

export type EstimatePickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange"
> & {
  inline?: "text" | "icon";
  issue: Issue;
};

export function EstimatePicker(props: EstimatePickerProps) {
  const { issue, style, className, inline, ...selectPickerProps } = props;
  const { update, issueEstimations } = useIssueContext();

  if (!issueEstimations || issueEstimations.length === 0) {
    return null;
  }

  const estimate =
    issueEstimations.find((e) => e.value === issue.estimate) || null;

  return (
    <Tooltip
      tooltip={inline === "icon" ? <Estimate estimate={estimate} /> : undefined}
      delayOpen={0}
    >
      <div
        className={`estimatePickerContainer ${className || ""}`}
        is-inline={inline}
      >
        <SelectPicker
          style={style}
          data={issueEstimations}
          value={issue.estimate || null}
          onChange={(value) => update.issue(issue.id, { estimate: value })}
          placeholder={<Estimate estimate={null} inline={inline} />}
          cleanable={false}
          {...selectPickerProps}
        />
      </div>
    </Tooltip>
  );
}

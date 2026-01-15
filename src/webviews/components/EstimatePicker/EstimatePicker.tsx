import { SelectPicker } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Estimate } from "./Estimate";

export type EstimatePickerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function EstimatePicker(props: EstimatePickerProps) {
  const { style, className } = props;
  const { issue, update, issueEstimations } = useIssueContext();

  if (!issueEstimations || issueEstimations.length === 0) {
    return null;
  }

  return (
    <SelectPicker
      data={issueEstimations}
      style={style}
      className={className}
      value={issue.estimate || null}
      onChange={(value) => update.issue({ estimate: value })}
      placeholder={<Estimate estimate={null} />}
      cleanable={false}
    />
  );
}

import { SelectPicker } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Estimate } from "./Estimate";
import { EstimateDataItem } from "src/webviews/utils/issueEstimateByType";

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
      value={issue.estimate || undefined}
      onChange={(value) => update.issue({ estimate: value })}
      placeholder={<Estimate estimate={null} />}
      renderOption={(_, item) => (
        <Estimate estimate={item as EstimateDataItem} />
      )}
      renderValue={(_, item) => {
        if (!item?.value) return undefined;
        return <Estimate estimate={item as EstimateDataItem} />;
      }}
      cleanable={false}
    />
  );
}

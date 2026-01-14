import { EstimateDataItem } from "src/webviews/utils/issueEstimateByType";
import { EstimateIcon } from "./EstimateIcon";

export type PriorityProps = {
  style?: React.CSSProperties;
  className?: string;
  estimate?: EstimateDataItem | null;
  inline?: boolean;
};

export function Estimate(props: PriorityProps) {
  const { style, className, estimate, inline } = props;

  function getLabel() {
    if (!estimate) {
      return "No estimate";
    } else if (typeof estimate.label === "number") {
      return `${estimate.label} Point${estimate.label !== 1 ? "s" : ""}`;
    } else {
      return estimate.label;
    }
  }

  if (inline) {
    return getLabel();
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        opacity: estimate?.value ? 1 : 0.5,
        ...style,
      }}
    >
      <EstimateIcon estimate={estimate} style={{ marginRight: 8 }} />
      {getLabel()}
    </div>
  );
}

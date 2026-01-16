import { EstimateDataItem } from "src/webviews/utils/issueEstimateByType";
import { EstimateIcon } from "./EstimateIcon";

export type PriorityProps = {
  style?: React.CSSProperties;
  className?: string;
  estimate?: EstimateDataItem | null;
  inline?: "text" | "icon";
};

export function Estimate(props: PriorityProps) {
  const { style, className, estimate, inline } = props;

  function getLabel() {
    if (!estimate?.inlineValue) {
      return <span className="estimateLabel">No estimate</span>;
    } else if (typeof estimate?.inlineValue === "number") {
      return (
        <>
          <span style={{ marginRight: 4 }}>{estimate?.inlineValue}</span>
          <span className="estimateLabel">
            Point{estimate?.inlineValue !== 1 ? "s" : ""}
          </span>
        </>
      );
    } else {
      return estimate?.inlineValue;
    }
  }

  if (inline === "text") {
    return getLabel();
  } else if (inline === "icon") {
    return (
      <EstimateIcon estimate={estimate} style={style} className={className} />
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        opacity: estimate?.value ? 1 : 0.3,
        ...style,
      }}
    >
      <EstimateIcon
        estimate={estimate}
        style={{ marginRight: 8 }}
        className="estimateIcon"
      />
      {getLabel()}
    </div>
  );
}

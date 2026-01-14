import { IssuePriorityValue } from "@linear/sdk";
import { PriorityIcon } from "./PriorityIcon";

export type PriorityProps = {
  style?: React.CSSProperties;
  className?: string;
  priority?: IssuePriorityValue;
  inline?: boolean;
};

export function Priority(props: PriorityProps) {
  const { style, className, priority, inline } = props;

  if (inline) {
    return priority?.label || "No priority";
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        ...style,
      }}
    >
      <PriorityIcon priority={priority} style={{ marginRight: 8 }} />
      {priority?.label || "No priority"}
    </div>
  );
}

import { IssuePriorityValue } from "@linear/sdk";
import { PriorityIcon } from "./PriorityIcon";

export type PriorityProps = {
  style?: React.CSSProperties;
  className?: string;
  priority?: IssuePriorityValue;
  inline?: "text" | "icon" | null;
};

export function Priority(props: PriorityProps) {
  const { style, className, priority, inline } = props;

  if (inline === "text") {
    return priority?.label || "No priority";
  } else if (inline === "icon") {
    return (
      <PriorityIcon
        priority={priority}
        style={{ opacity: priority?.priority ? 1 : 0.3 }}
        className={className}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        opacity: priority?.priority ? 1 : 0.3,
        ...style,
      }}
    >
      <PriorityIcon priority={priority} style={{ marginRight: 8 }} />
      {priority?.label || "No priority"}
    </div>
  );
}

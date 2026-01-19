import { IssuePriorityValue } from "@linear/sdk";
import { PriorityIcon } from "./PriorityIcon";

export type PriorityProps = {
  style?: React.CSSProperties;
  className?: string;
  priority?: IssuePriorityValue;
  inline?: "text" | "icon" | null;
  size?: number;
};

export function Priority(props: PriorityProps) {
  const { style, className, priority, inline, size } = props;

  if (inline === "text") {
    return priority?.label || "No priority";
  } else if (inline === "icon") {
    return (
      <PriorityIcon priority={priority} className={className} size={size} />
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        fontSize: size,
        ...style,
      }}
    >
      <PriorityIcon
        priority={priority}
        style={{ marginRight: 8 }}
        size={size}
      />
      {priority?.label || "No priority"}
    </div>
  );
}

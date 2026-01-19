import { Ref } from "src/types/GitAPI";
import { BranchIcon } from "../Icons/BranchIcon";
import { ReactNode } from "react";

export type BranchProps = {
  style?: React.CSSProperties;
  className?: string;
  branch?: Ref | null;
  inline?: "text" | "icon" | null;
  size?: number;
};

export function Branch(props: BranchProps): ReactNode {
  const { style, className, branch, inline, size } = props;

  if (inline === "text") {
    return branch?.name || "No branch name";
  } else if (inline === "icon") {
    return (
      <BranchIcon
        style={{ opacity: branch ? 1 : 0.3 }}
        className={className}
        size={size}
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
        opacity: branch ? 1 : 0.3,
        fontSize: size,
        ...style,
      }}
    >
      <BranchIcon style={{ marginRight: 8 }} size={size} />
      {branch?.name || "No branch name"}
    </div>
  );
}

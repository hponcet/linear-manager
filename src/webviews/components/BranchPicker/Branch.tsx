import { Ref } from "src/types/GitAPI";
import { BranchIcon } from "../Icons/BranchIcon";
import { ReactNode } from "react";

import "./Branch.scss";
import { Tooltip } from "../Tooltip/Tooltip";
import { GlobeIcon } from "../Icons/GlobeIcon";

export type BranchProps = {
  style?: React.CSSProperties;
  className?: string;
  branch?: Ref | null;
  currentBranch?: Ref | null;
  inline?: "text" | "icon" | null;
  size?: number;
};

export function Branch(props: BranchProps): ReactNode {
  const { branch, currentBranch, style, className, inline, size } = props;

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
      className="branchContainer"
      style={{
        opacity: branch ? 1 : 0.3,
        fontSize: size,
        ...style,
      }}
    >
      <div className="branchName">
        <div
          style={{
            marginRight: 8,
            display: "inline-flex",
            alignContent: "center",
          }}
        >
          <BranchIcon size={size} />
          {branch?.remote && (
            <Tooltip tooltip="Remote branch">
              <div style={{ height: "fit-content" }}>
                <GlobeIcon />
              </div>
            </Tooltip>
          )}
        </div>
        {branch?.name || "No branch name"}
        {branch && currentBranch && branch?.name === currentBranch?.name && (
          <span className="branchIsCurrent">(current branch)</span>
        )}
      </div>
    </div>
  );
}

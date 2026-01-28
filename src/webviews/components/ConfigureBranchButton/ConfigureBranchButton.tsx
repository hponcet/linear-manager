import { useIssueBranches } from "src/webviews/hooks/useGitBranches";
import { Button, ButtonProps } from "../Button/Button";
import { BranchIcon } from "../Icons/BranchIcon";
import { Issue } from "@linear/sdk";
import { useRequestDataUpdate } from "src/webviews/hooks/useRequestDataUpdate";

export type ConfigureBranchButtonProps = ButtonProps & {
  issue: Issue;
  size?: number;
  inline?: "icon";
  className?: string;
  style?: React.CSSProperties;
};

export function ConfigureBranchButton(props: ConfigureBranchButtonProps) {
  const { issue, className, style, size, inline, onClick, ...buttonProps } =
    props;

  const { startWork } = useRequestDataUpdate();
  const { repoInitialized } = useIssueBranches({ issueId: issue.id });

  async function handleClick() {
    await startWork(issue.id);
    await onClick?.();
  }

  return (
    <Button
      style={style}
      className={className}
      onClick={handleClick}
      disabled={!repoInitialized}
      tooltip={
        !repoInitialized
          ? "Git repository is not initialized"
          : `Configure branch for issue ${issue.identifier}`
      }
      icon={
        <BranchIcon
          size={size}
          style={{ marginRight: inline === "icon" ? 0 : 8 }}
        />
      }
      {...buttonProps}
    >
      {inline === "icon" ? null : "Configure Branch"}
    </Button>
  );
}

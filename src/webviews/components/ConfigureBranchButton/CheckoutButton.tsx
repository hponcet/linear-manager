import { Button, ButtonProps } from "../Button/Button";
import { Issue } from "@linear/sdk";
import { useIssueBranches } from "src/webviews/hooks/useGitBranches";
import { Branch } from "../BranchPicker/Branch";
import { CheckoutIcon } from "../Icons/CheckoutIcon";

export type CheckoutButtonProps = ButtonProps & {
  issue: Issue;
  size?: number;
  inline?: "icon";
  className?: string;
  style?: React.CSSProperties;
};

export function CheckoutButton(props: CheckoutButtonProps) {
  const { issue, className, style, size, inline, onClick, ...buttonProps } =
    props;

  const {
    checkoutBranch,
    issueBranch,
    currentBranch,
    isLoading,
    issueSettings,
    repoInitialized,
    hasUncommittedChanges,
  } = useIssueBranches({
    issueId: issue.id,
  });

  async function handleClick() {
    await checkoutBranch();
    await onClick?.();
  }

  const isOnIssueBranch =
    issueBranch && currentBranch && issueBranch?.name === currentBranch?.name;

  if (isLoading || isOnIssueBranch || !issueSettings?.branchInitialized) {
    return null;
  }

  return (
    <Button
      style={style}
      className={className}
      onClick={handleClick}
      disabled={!repoInitialized || hasUncommittedChanges}
      tooltip={
        !repoInitialized ? (
          "Git repository is not initialized"
        ) : hasUncommittedChanges ? (
          "You have uncommitted changes"
        ) : (
          <span>
            <CheckoutIcon /> Checkout on branch{" "}
            <Branch branch={issueBranch} inline="text" />
          </span>
        )
      }
      icon={
        <CheckoutIcon
          size={size}
          style={{ marginRight: inline === "icon" ? 0 : 8 }}
        />
      }
      {...buttonProps}
    >
      {inline === "icon" ? null : "Checkout Branch"}
    </Button>
  );
}

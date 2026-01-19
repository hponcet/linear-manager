import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Button } from "../Button/Button";
import { BranchIcon } from "../Icons/BranchIcon";
import { Issue } from "@linear/sdk";

export type StartWorkButtonProps = {
  issue: Issue;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function StartWorkButton(props: StartWorkButtonProps) {
  const { issue, className, style, size } = props;

  const { update } = useIssueContext();

  return (
    <Button
      style={style}
      className={className}
      onClick={() => update.panelActions.startWork(issue.id)}
      tooltip={`Start work on issue ${issue.identifier}`}
    >
      <BranchIcon size={size} />
    </Button>
  );
}

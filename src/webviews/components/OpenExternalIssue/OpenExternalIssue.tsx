import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Button } from "../Button/Button";
import { Issue } from "@linear/sdk";
import { OpenExternalIcon } from "../Icons/OpenExternalIcon";

export type OpenExternalIssueProps = {
  issue: Issue;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function OpenExternalIssue(props: OpenExternalIssueProps) {
  const { issue, className, style, size } = props;

  const { update } = useIssueContext();

  return (
    <Button
      style={style}
      className={className}
      onClick={() => update.panelActions.openExternal()}
      tooltip={`Open issue ${issue.identifier} on Linear.app`}
      icon={<OpenExternalIcon size={size} />}
    />
  );
}

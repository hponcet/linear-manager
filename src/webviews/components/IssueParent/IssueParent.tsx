import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { useAsyncMemo } from "src/webviews/hooks/useAsyncMemo";
import { Issue } from "../Issue/Issue";

export function IssueParent() {
  const { issue } = useIssueContext();

  const [parent, parentLoading] = useAsyncMemo(async () => {
    if (!issue?.parentId) {
      return null;
    }
    return issue.parent;
  }, [issue?.parentId]);

  if (!parent || parentLoading) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: 30,
        fontSize: 14,
        color: "var(--rs-text-secondary)",
      }}
    >
      Sub-Issue of
      <Issue issue={parent} />
    </div>
  );
}

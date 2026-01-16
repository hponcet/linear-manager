import { IssueTitleInput } from "src/webviews/components/Input/IssueTitleInput";
import { Editor } from "src/webviews/components/Editor/Editor";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

export function IssueContent() {
  const { issue } = useIssueContext();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <IssueTitleInput defaultValue={issue?.title} />
      <Editor value={issue?.description || ""} />
    </div>
  );
}

import { IssueTitleInput } from "src/webviews/components/Input/IssueTitleInput";
import { Editor } from "src/webviews/components/Editor/Editor";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

export function IssueContent() {
  const { issue, update } = useIssueContext();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <IssueTitleInput
        defaultValue={issue?.title}
        onSave={(value) => update.issue({ title: value })}
      />
      <Editor
        value={issue?.description || ""}
        onChange={(value) => update.issue({ description: value })}
      />
    </div>
  );
}

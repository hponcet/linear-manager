import { IssueTitleInput } from "src/webviews/components/Input/IssueTitleInput";
import { Editor } from "src/webviews/components/Editor/Editor";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { EmojiPicker } from "src/webviews/components/EmojiPicker/EmojiPicker";
import { IssueParent } from "src/webviews/components/IssueParent/IssueParent";

export function IssueContent() {
  const { issue, update } = useIssueContext();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <IssueTitleInput defaultValue={issue?.title} />
      <IssueParent />
      <Editor value={issue?.description || ""} />
      <div style={{ margin: "20px 0 16px" }}>
        <EmojiPicker
          placement="bottomStart"
          onSelect={async (emoji) => {
            await update.addReaction({ emoji, issueId: issue?.id || "" });
          }}
          onUnselect={async (id) => {
            await update.removeReaction(id);
          }}
          reactions={issue?.reactions || []}
        />
      </div>
    </div>
  );
}

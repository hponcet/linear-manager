import { Editor } from "src/webviews/components/Editor/Editor"
import { EmojiPicker } from "src/webviews/components/EmojiPicker/EmojiPicker"
import { IssueTitleInput } from "src/webviews/components/Input/IssueTitleInput"
import { IssueParent } from "src/webviews/components/IssueParent/IssueParent"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

export function IssueContent() {
  const { issue, update } = useIssueContext()

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <IssueTitleInput value={issue?.title} deleted={issue?.trashed} />
      <IssueParent />
      <Editor value={issue?.description || ""} />
      <div style={{ margin: "20px 0 16px" }}>
        <EmojiPicker
          placement="bottomStart"
          onSelect={async (emoji) => {
            await update.reactions.addReaction({
              emoji,
              issueId: issue?.id || "",
            })
          }}
          onUnselect={async (id) => {
            await update.reactions.removeReaction(id)
          }}
          reactions={issue?.reactions || []}
        />
      </div>
    </div>
  )
}

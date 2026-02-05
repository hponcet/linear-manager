import { useState } from "react"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { Button } from "../Button/Button"
import { Editor } from "../Editor/Editor"
import { SendIcon } from "../Icons/SendIcon"

import "./CommentInput.scss"

export function CommentInput() {
  const { update } = useIssueContext()

  const [value, setValue] = useState("")
  const [resetEditor, setResetEditor] = useState(0)

  async function sendComment() {
    if (!value.trim()) {
      return
    }
    await update.comments.addComment(value)

    setValue("")
    setResetEditor((prev) => prev + 1)
  }

  return (
    <div className="commentInputContainer">
      <Editor
        key={resetEditor}
        placeholder="Leave a comment..."
        value={value}
        editable
        onChange={setValue}
      />
      <div className="commentActions">
        <Button
          disabled={!value.trim()}
          onClick={sendComment}
          className="commentSendButton"
          tooltip="Send Comment"
          color="#6d78e7"
        >
          <SendIcon />
        </Button>
      </div>
    </div>
  )
}

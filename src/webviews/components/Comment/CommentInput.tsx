import { useState } from "react"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { Button } from "../Button/Button"
import { Editor } from "../Editor/Editor"
import { SendIcon } from "../Icons/SendIcon"

import "./CommentInput.scss"

export function CommentInput() {
  const { update } = useIssueContext()

  const [value, setValue] = useState("")
  const [markdownValid, setMarkdownValid] = useState(false)
  const [resetEditor, setResetEditor] = useState(0)

  async function sendComment() {
    if (!markdownValid || !value.trim()) {
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
        ariaLabel="New issue comment"
        onChange={setValue}
        onValidityChange={setMarkdownValid}
      />
      <div className="commentActions">
        <Button
          disabled={!markdownValid || !value.trim()}
          onClick={sendComment}
          variant="primary"
          iconOnly
          round
          tooltip="Send Comment"
          icon={<SendIcon />}
        />
      </div>
    </div>
  )
}

import { useState } from "react";
import { Editor } from "../../Editor/Editor";

import { SendIcon } from "../../Icons/SendIcon";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Button } from "../../Button/Button";

import "./CommentInput.scss";

export function CommentInput() {
  const { update } = useIssueContext();

  const [value, setValue] = useState("");

  async function sendComment() {
    if (!value.trim()) {
      return;
    }
    await update.addComment(value);

    setValue("");
  }

  return (
    <div className="commentInputContainer">
      <Editor
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
  );
}

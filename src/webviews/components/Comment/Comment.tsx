import { useEffect, useRef, useState } from "react";
import { User } from "@linear/sdk";

import { UserAvatar } from "src/webviews/components/UserAvatar/UserAvatar";

import { Editor } from "../Editor/Editor";

import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Button } from "../Button/Button";
import { ReplyIcon } from "../Icons/ReplyIcon";
import { Comment as CommentType } from "src/webviews/utils/comments";

import { EditIcon } from "../Icons/EditIcon";
import { DeleteIcon } from "../Icons/DeleteIcon";
import { ResolveIcon } from "../Icons/ResolveIcon";
import moment from "moment";
import { Editor as EditorType } from "@tiptap/core";
import { useDialog } from "rsuite";
import { EmojiPicker } from "../EmojiPicker/EmojiPicker";

import "./Comment.scss";

type CommentProps = {
  comment: CommentType;
  user: User | null;
  isChildren?: boolean;
  isResolved: boolean;
  parentCommentId: string;
  setExpanded: (expanded: boolean) => void;
  startReply?: () => void;
};

export function Comment(props: CommentProps) {
  const {
    comment,
    user,
    isChildren,
    isResolved,
    parentCommentId,
    setExpanded,
    startReply,
  } = props;

  const { update, me } = useIssueContext();
  const dialog = useDialog();

  const commentEditorRef = useRef<EditorType | null>(null);

  const [updateValue, setUpdateValue] = useState<string | null>(null);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setUpdateValue(null);
    }
  }

  useEffect(() => {
    setUpdateValue(null);
  }, [comment?.body]);

  async function deleteComment() {
    const shouldDelete = await dialog.confirm(
      "Are you sure you want to delete this comment?",
      {
        title: "Delete Comment",
        okText: "Delete",
        cancelText: "Cancel",
        severity: "error",
      }
    );
    if (shouldDelete) {
      await update.comments.deleteComment(comment.id);
    }
  }

  return (
    <div className="issueComment">
      <div className="issueCommentHeader">
        <div className="issueCommentAuthor">
          {user ? (
            <>
              <UserAvatar user={user} size={16} />
              <div className="issueCommentAuthorName">
                {user?.displayName || "Unknown User"}
              </div>
            </>
          ) : null}
          <div className="issueCommentTimestamp">
            {moment(comment.createdAt).fromNow()}{" "}
            {comment.createdAt.toString() !== comment.updatedAt.toString()
              ? "(edited)"
              : ""}
          </div>
          {!!comment.resolver && (
            <div className="issueCommentResolver">Resolution</div>
          )}
        </div>

        <div className="issueCommentActions">
          {startReply && (
            <Button tooltip="Reply" onClick={startReply}>
              <ReplyIcon />
            </Button>
          )}
          {(!isResolved || !isChildren) && (
            <Button
              tooltip={
                isResolved
                  ? "Mark thread as unresolved"
                  : "Mark thread as resolved"
              }
              onClick={async () => {
                if (isResolved) {
                  await update.comments.unresolveComment(parentCommentId);
                  setExpanded(true);
                } else {
                  await update.comments.resolveComment(
                    parentCommentId,
                    comment.id
                  );
                  setExpanded(false);
                }
              }}
            >
              <ResolveIcon />
            </Button>
          )}
          <EmojiPicker
            onSelect={async (emoji) => {
              await update.reactions.addReaction({
                emoji,
                commentId: comment.id,
              });
            }}
          />
          {me?.id === comment.userId && (
            <>
              <Button
                tooltip="Edit"
                onClick={() => {
                  setUpdateValue((v) => (v ? null : comment.body));
                  setTimeout(() => {
                    commentEditorRef.current?.commands.focus("end");
                  }, 300);
                }}
              >
                <EditIcon />
              </Button>
              <Button tooltip="Delete" onClick={deleteComment}>
                <DeleteIcon />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="issueCommentContent" is-children={String(!!isChildren)}>
        <div
          className="issueCommentEditor"
          ref={(el) => {
            el?.addEventListener("keydown", onKeyDown);
          }}
        >
          <Editor
            key={typeof updateValue === "string" ? "editing" : comment.body}
            value={updateValue || comment.body}
            editable={typeof updateValue === "string"}
            onChange={setUpdateValue}
            getEditor={(editor) => (commentEditorRef.current = editor)}
          />
        </div>
        {typeof updateValue === "string" ? (
          <div className="issueCommentUpdateActions">
            <Button
              onClick={() => setUpdateValue(null)}
              className="issueCommentUpdateButton-cancel"
            >
              Cancel
            </Button>
            <Button
              disabled={!updateValue.trim() || updateValue === comment.body}
              onClick={async () => {
                await update.comments.updateComment(
                  comment.id,
                  updateValue.trim()
                );
              }}
              className="issueCommentUpdateButton"
            >
              Save
            </Button>
          </div>
        ) : comment.reactions?.length ? (
          <EmojiPicker
            reactions={comment.reactions}
            onSelect={async (emoji) => {
              await update.reactions.addReaction({
                emoji,
                commentId: comment.id,
              });
            }}
            onUnselect={(id) => update.reactions.removeReaction(id)}
          />
        ) : null}
      </div>
    </div>
  );
}

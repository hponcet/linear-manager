import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Comment as CommentType } from "src/webviews/utils/comments";

import { Comment } from "./Comment";

import { useState } from "react";
import { Editor } from "../Editor/Editor";
import { Button } from "../Button/Button";
import { SendIcon } from "../Icons/SendIcon";

import "./CommentGroup.scss";
import { CommentExpander } from "./CommentExpander";

type CommentGroupProps = {
  comment: CommentType;
};

export function CommentGroup(props: CommentGroupProps) {
  const { comment } = props;
  const { id, resolvingCommentId, resolvingUserId, childrenComments } = comment;

  const { users, update } = useIssueContext();

  const [replyValue, setReplyValue] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(
    !resolvingCommentId && !resolvingUserId
  );

  function onKeyDown(e: KeyboardEvent) {
    if (childrenComments?.length) return;

    if (e.key === "Escape") {
      setReplyValue(null);
    }
  }

  const threadResolvedByComment = !!resolvingCommentId;
  const threadResolvedByUser = !threadResolvedByComment && !!resolvingUserId;

  function displayComment(
    c: CommentType,
    index: number,
    showSeparator = true,
    isChildren: boolean
  ) {
    const user = users.find((u) => u.id === c.userId) || null;
    return (
      <div
        className="issueCommentWrapper"
        key={c.id}
        is-hidden={
          expanded
            ? "false"
            : threadResolvedByUser
            ? "true"
            : threadResolvedByComment && isChildren && !c.resolver
            ? "true"
            : "false"
        }
      >
        <Comment
          comment={c}
          user={user}
          setExpanded={setExpanded}
          parentCommentId={comment.id}
          isResolved={!!resolvingCommentId || !!resolvingUserId}
          startReply={
            index === 0 && !c.childrenComments?.length
              ? () => {
                  setReplyValue((r) => (r === "" ? null : r || ""));
                }
              : undefined
          }
          isChildren={isChildren}
        />
        {showSeparator && (
          <div
            className="issueCommentSeparator"
            is-child={isChildren ? "true" : "false"}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="issueCommentGroup"
      is-resolved-by-user={!!threadResolvedByUser ? "true" : "false"}
      is-resolved-by-comment={
        !!threadResolvedByComment || !!threadResolvedByUser ? "true" : "false"
      }
      is-expanded={expanded ? "true" : "false"}
    >
      {displayComment(comment, 0, false, false)}

      {childrenComments && childrenComments.length > 0 && (
        <div className="issueCommentSeparator" is-child={"false"} />
      )}

      <CommentExpander
        comment={comment}
        expanded={expanded}
        setExpanded={setExpanded}
      />

      {childrenComments?.map((c, i, a) =>
        displayComment(c, i, i < a.length - 1, true)
      )}

      {(typeof replyValue === "string" ||
        (childrenComments && childrenComments.length > 0)) && (
        <div
          is-hidden={
            expanded
              ? "false"
              : threadResolvedByUser || threadResolvedByComment
              ? "true"
              : "false"
          }
          className="issueCommentReply"
          ref={(el) => {
            el?.addEventListener("keydown", onKeyDown);
          }}
        >
          <div className="issueCommentReplyEditor">
            <Editor
              placeholder={`Leave a reply...`}
              editable
              value={replyValue || ""}
              onChange={setReplyValue}
              getEditor={(editor) => {
                if (!childrenComments?.length) {
                  editor?.commands.focus("end");
                }
              }}
            />
          </div>
          <div className="issueCommentReplyActions">
            <Button
              disabled={!(replyValue || "").trim()}
              onClick={async () => {
                await update.sendCommentReply(id, replyValue || "");
                setReplyValue("");
              }}
              className="commentSendButton"
              tooltip="Send Comment"
              color="#6d78e7"
            >
              <SendIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

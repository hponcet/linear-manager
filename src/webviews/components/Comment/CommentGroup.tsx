import { useEffect, useState } from "react"
import { Animation } from "rsuite"
import { useIssueContext } from "src/webviews/contexts/IssueContext"
import { Comment as CommentType, isCommentThreadResolved } from "src/webviews/utils/comments"

import { Comment } from "./Comment"
import { CommentExpander } from "./CommentExpander"

import { Button } from "../Button/Button"
import { Editor } from "../Editor/Editor"
import { SendIcon } from "../Icons/SendIcon"

import "./CommentGroup.scss"

type CommentGroupProps = {
  comment: CommentType
}

export function CommentGroup(props: CommentGroupProps) {
  const { comment } = props
  const { id, childrenComments } = comment
  const threadResolved = isCommentThreadResolved(comment)
  const { resolvingCommentId, resolvingUserId } = comment

  const { users, update } = useIssueContext()

  const [replyValue, setReplyValue] = useState<string | null>(null)
  const [replyMarkdownValid, setReplyMarkdownValid] = useState(false)
  const [expanded, setExpanded] = useState(!threadResolved)
  const [resetEditor, setResetEditor] = useState(0)

  useEffect(() => {
    setExpanded(!isCommentThreadResolved(comment))
  }, [comment.resolvingCommentId, comment.resolvingUserId, comment.resolvedAt])

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (childrenComments?.length) return

    if (e.key === "Escape" && !e.defaultPrevented) {
      setReplyValue(null)
    }
  }

  const threadResolvedByComment = !!resolvingCommentId
  const threadResolvedByUser = !threadResolvedByComment && !!resolvingUserId

  function displayComment(
    c: CommentType,
    index: number,
    showSeparator = true,
    isChildren: boolean,
  ) {
    const user = users.find((u) => u.id === c.userId) || null

    const shouldCollapse = expanded
      ? false
      : threadResolvedByUser
        ? true
        : threadResolvedByComment && isChildren && !c.resolver
          ? true
          : false

    return (
      <Animation.Collapse in={!shouldCollapse} key={c.id}>
        {(props, ref) => (
          <div ref={ref} {...props} className={`issueCommentWrapper ${props.className || ""}`}>
            <Comment
              comment={c}
              user={user}
              setExpanded={setExpanded}
              parentCommentId={comment.id}
              isResolved={threadResolved}
              startReply={
                index === 0 && !c.childrenComments?.length
                  ? () => {
                      setReplyValue((r) => (r === "" ? null : r || ""))
                    }
                  : undefined
              }
              isChildren={isChildren}
            />
            {showSeparator && (
              <div className="issueCommentSeparator" is-child={isChildren ? "true" : "false"} />
            )}
          </div>
        )}
      </Animation.Collapse>
    )
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

      <CommentExpander comment={comment} expanded={expanded} setExpanded={setExpanded} />

      {childrenComments?.map((c, i, a) => displayComment(c, i, i < a.length - 1, true))}

      {(typeof replyValue === "string" || (childrenComments && childrenComments.length > 0)) && (
        <div
          is-hidden={
            expanded ? "false" : threadResolvedByUser || threadResolvedByComment ? "true" : "false"
          }
          className="issueCommentReply"
          onKeyDown={onKeyDown}
        >
          <div className="issueCommentReplyEditor">
            <Editor
              key={resetEditor}
              placeholder={`Leave a reply...`}
              editable
              ariaLabel="Reply to comment"
              value={replyValue || ""}
              onChange={setReplyValue}
              onValidityChange={setReplyMarkdownValid}
              getEditor={(editor) => {
                if (!childrenComments?.length) {
                  editor?.commands.focus("end")
                }
              }}
            />
          </div>
          <div className="issueCommentReplyActions">
            <Button
              disabled={!replyMarkdownValid || !(replyValue || "").trim()}
              onClick={async () => {
                const body = replyValue || ""
                if (!replyMarkdownValid || !body.trim()) return

                await update.comments.sendCommentReply(id, body)
                setReplyValue("")
                setResetEditor((prev) => prev + 1)
              }}
              variant="primary"
              iconOnly
              round
              tooltip="Send Comment"
              icon={<SendIcon />}
            />
          </div>
        </div>
      )}
    </div>
  )
}

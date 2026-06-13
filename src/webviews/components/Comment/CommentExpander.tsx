import { useIssueContext } from "src/webviews/contexts/IssueContext"
import { Comment as CommentType, isCommentThreadResolved } from "src/webviews/utils/comments"

import { CollapseIcon } from "../Icons/CollapseIcon"
import { ExpandIcon } from "../Icons/ExpandIcon"
import { ResolveIcon } from "../Icons/ResolveIcon"

import "./CommentExpander.scss"

type CommentExpanderProps = {
  comment: CommentType
  expanded: boolean
  setExpanded: (expanded: boolean) => void
}

export function CommentExpander(props: CommentExpanderProps) {
  const { comment, expanded, setExpanded } = props

  const { users } = useIssueContext()

  if (!isCommentThreadResolved(comment) || !comment.childrenComments) {
    return null
  }

  const user = users.find((u) => u.id === comment.resolvingUserId) || null

  let commentCount = 0

  if (comment.resolvingCommentId) {
    commentCount = comment.childrenComments.length - 1
  } else {
    commentCount = comment.childrenComments.length + 1
  }

  return (
    <>
      <div className="commentExpander" onClick={() => setExpanded(!expanded)}>
        <div>
          <ResolveIcon style={{ fill: "var(--color-success)" }} />
          <span className="commentExpanderResolver">{user?.email}</span>{" "}
          <span>resolved the thread</span>
        </div>
        <div className="commentExpanderIcon">
          {expanded ? (
            <>
              <span>Collapse</span>
              <CollapseIcon />
            </>
          ) : (
            <>
              <span>{commentCount} comments</span>
              <ExpandIcon />
            </>
          )}
        </div>
      </div>
      <div className="issueCommentSeparator" />
    </>
  )
}

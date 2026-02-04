import { useMemo } from "react"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { IssueHistory } from "./IssueHistory"

import { CommentGroup } from "../Comment/CommentGroup"
import { getFirstHistoryType } from "../InlineIssue/historyUtils"

import "./IssueActivity.scss"

export function IssueActivity() {
  const { comments, history } = useIssueContext()

  const concatHistory = useMemo(() => {
    const mappedHistory =
      (history?.map((h) =>
        Object.fromEntries(
          Object.entries(h).filter(([k, v], i, arr) => {
            if (!!v) {
              return true
            }
            if (k.startsWith("from") || k.startsWith("to")) {
              const correspondingKey = `${
                k.startsWith("from") ? "to" : "from"
              }${k.replace(/^(from|to)/, "")}`
              const correspondingEntry = arr.find(([key]) => key === correspondingKey)
              if (correspondingEntry?.[1] !== undefined) {
                return true
              }
            }
            return false
          }),
        ),
      ) as NonNullable<typeof history>[number][]) || []

    return (
      mappedHistory.reduce(
        (acc, curr) => {
          const prevGroup = acc[acc.length - 1]
          const prevItem = prevGroup?.[prevGroup?.length - 1]

          if (prevItem && getFirstHistoryType(prevItem) === getFirstHistoryType(curr)) {
            acc[acc.length - 1].push(curr)
          } else {
            acc.push([curr])
          }
          return acc
        },
        [] as NonNullable<typeof history>[number][][],
      ) || []
    )
  }, [history, comments])

  const activity = useMemo(() => {
    const combined = [...(comments || []), ...concatHistory]
    combined.sort((a, b) => {
      const dateA = new Date(Array.isArray(a) ? a[a.length - 1].createdAt : a.createdAt).getTime()
      const dateB = new Date(Array.isArray(b) ? b[b.length - 1].createdAt : b.createdAt).getTime()
      return dateA - dateB
    })
    return combined
  }, [comments, concatHistory])

  if (!comments || !history) {
    return <div>Loading comments...</div>
  }

  return (
    <div className="issueActivityContainer">
      <h5>Activity</h5>
      <div style={{ position: "relative" }}>
        <div className="activityBreadcrumbTrail" />
        {activity.length === 0 ? (
          <div className="issueActivityEmpty">No comments or activity yet.</div>
        ) : (
          <>
            {activity.map((item) => {
              if (Array.isArray(item)) {
                return <IssueHistory key={item[0].id} history={item} />
              } else if (item.__key === "comment") {
                return <CommentGroup key={item.id} comment={item} />
              } else {
                return null
              }
            })}
          </>
        )}
      </div>
    </div>
  )
}

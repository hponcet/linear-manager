import { useState } from "react"
import { Animation } from "rsuite"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { CreateSubIssue } from "./CreateSubIssue"

import { Button } from "../Button/Button"
import { CaretIcon } from "../Icons/CaretIcon"
import { PlusIcon } from "../Icons/PlusIcon"
import { InlineIssue } from "../InlineIssue/InlineIssue"

import "./SubIssues.scss"

type SubIssuesProps = {
  style?: React.CSSProperties
  className?: string
}

export function SubIssues(props: SubIssuesProps) {
  const { style, className } = props

  const { subIssues } = useIssueContext()

  const [collapsed, setCollapsed] = useState(false)
  const [createIssueCollapsed, setCreateIssueCollapsed] = useState(true)

  const noSubIssues = !subIssues || subIssues.length === 0

  return (
    <div className={`subIssuesContainer ${className || ""}`} style={style}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <Button
          onClick={() =>
            noSubIssues ? setCreateIssueCollapsed(!createIssueCollapsed) : setCollapsed(!collapsed)
          }
          disabled={noSubIssues && !createIssueCollapsed}
          className="subIssuesButton"
          appearance="subtle"
        >
          {noSubIssues ? (
            <>
              <PlusIcon style={{ marginRight: 6 }} />
              <span>Add sub-issues</span>
            </>
          ) : (
            <>
              <CaretIcon
                style={{
                  transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
                  transition: "transform 0.3s",
                  marginRight: 6,
                }}
              />
              <span>Sub-issues</span>
            </>
          )}
        </Button>
        {!noSubIssues && (
          <Button
            onClick={() => setCreateIssueCollapsed(!createIssueCollapsed)}
            disabled={noSubIssues && !createIssueCollapsed}
            className="attachmentsAddButton"
            icon={<PlusIcon size={14} />}
            appearance="subtle"
          />
        )}
      </div>
      <Animation.Collapse in={!collapsed}>
        {(props, ref) => (
          <div ref={ref} {...props}>
            <div className="subIssuesList">
              {subIssues?.map((issue) => (
                <InlineIssue key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        )}
      </Animation.Collapse>
      <Animation.Collapse in={!createIssueCollapsed} unmountOnExit>
        {(props, ref) => (
          <div ref={ref} {...props}>
            <CreateSubIssue
              className="subIssuesCreateSubIssue"
              onCancel={() => setCreateIssueCollapsed(true)}
            />
          </div>
        )}
      </Animation.Collapse>
    </div>
  )
}

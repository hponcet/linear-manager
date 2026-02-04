import { Issue, LinearClient } from "@linear/sdk"
import { useEffect, useState } from "react"
import { Button, Input } from "rsuite"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { AssigneePicker } from "../Assignee/AssigneePicker"
import { Editor } from "../Editor/Editor"
import { EstimatePicker } from "../EstimatePicker/EstimatePicker"
import { LabelsPicker } from "../LabelsPicker/LabelsPicker"
import { PriorityPicker } from "../PriorityPicker/PriorityPicker"
import { ProjectCyclePicker } from "../ProjectCyclePicker/ProjectCyclePicker"
import { IssueProjectPicker } from "../ProjectPicker/ProjectPicker"
import { WorkflowStatePicker } from "../WorklfowStatePicker/WorkflowStatePicker"

import "./CreateSubIssue.scss"

type CreateSubIssueProps = {
  style?: React.CSSProperties
  className?: string
  onCancel: () => void
}

export function CreateSubIssue(props: CreateSubIssueProps) {
  const { style, className, onCancel } = props

  const { issue: parentIssue, workflowStates, update } = useIssueContext()

  const [issue, setIssue] = useState<Parameters<LinearClient["updateIssue"]>[1]>({})

  useEffect(() => {
    setIssue({
      stateId: workflowStates.find((state) => state.type === "unstarted")?.id,
      priority: parentIssue.priority,
      cycleId: parentIssue.cycleId,
      title: "",
      description: "",
    })
  }, [!!parentIssue, workflowStates])

  if (!parentIssue || !workflowStates) return null

  return (
    <div className={`createSubIssueContainer ${className || ""}`} style={style}>
      <div className="createSubIssueStatePadding">
        <WorkflowStatePicker
          inline="icon"
          issue={issue as Issue}
          onChange={(stateId) => setIssue({ ...issue, stateId })}
        />
      </div>
      <div className="createSubIssueInputContainer">
        <Input
          type="text"
          className="createSubIssueTitle"
          placeholder="Issue title"
          value={issue.title || ""}
          onChange={(title) => setIssue({ ...issue, title })}
        />
        <Editor
          editable
          className="createSubIssueEditor"
          value={issue.description || ""}
          placeholder="Add a description..."
          onChange={(description) => setIssue({ ...issue, description })}
        />
        <div className="createSubIssueActions">
          <PriorityPicker
            issue={issue as Issue}
            onChange={(priority) => setIssue({ ...issue, priority: priority || undefined })}
          />
          <AssigneePicker
            issue={issue as Issue}
            onChange={(assigneeId) => setIssue({ ...issue, assigneeId: assigneeId || undefined })}
          />
          <EstimatePicker
            issue={issue as Issue}
            onChange={(estimate) => setIssue({ ...issue, estimate })}
          />
          <ProjectCyclePicker
            issue={issue as Issue}
            onChange={(cycleId) => setIssue({ ...issue, cycleId: cycleId || undefined })}
          />
          <IssueProjectPicker
            issue={issue as Issue}
            onChange={(projectId) => setIssue({ ...issue, projectId: projectId || undefined })}
          />
          <LabelsPicker
            issue={issue as Issue}
            onChange={(labelIds) => setIssue({ ...issue, labelIds: labelIds || [] })}
          />
          <div className="createSubIssueButtons">
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              disabled={!issue.title || issue.title.trim() === ""}
              appearance="primary"
              onClick={async () => {
                await update.subIssues.createSubIssue(parentIssue.id, issue)
                onCancel()
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

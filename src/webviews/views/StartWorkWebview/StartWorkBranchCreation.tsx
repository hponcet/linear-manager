import cx from "classnames"
import { useEffect, useMemo, useState } from "react"
import { useDialog } from "rsuite"
import { getFirstStateOfType } from "src/panels/commons/worflowStates"
import { Ref } from "src/types/GitAPI"
import { SerializedIssue } from "src/types/SerializedLinear"
import { IssueVscState } from "src/vscStates"
import { BranchNameInput } from "src/webviews/components/BranchNameInput/BranchNameInput"
import { Branch } from "src/webviews/components/BranchPicker/Branch"
import { BranchPicker } from "src/webviews/components/BranchPicker/BranchPicker"
import { Button } from "src/webviews/components/Button/Button"
import { CheckoutButton } from "src/webviews/components/ConfigureBranchButton/CheckoutButton"
import { FormQueueAsync } from "src/webviews/components/FormQueueAsync/FormQueueAsync"
import { FormQueueField } from "src/webviews/components/FormQueueAsync/FormQueueField"
import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker"
import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker"
import { useIssueContext } from "src/webviews/contexts/IssueContext"
import { useSettings } from "src/webviews/hooks/useSettings"
import { validateBranchName } from "src/webviews/utils/branches"

type StartWorkContentProps = {
  issue: SerializedIssue
  branches?: Ref[]
  currentBranch?: Ref | null
  initialBranchName: string
  stashChanges: boolean
  issueSettings: IssueVscState[SerializedIssue["id"]]
  updateIssueSettings: (value: Partial<IssueVscState[SerializedIssue["id"]]>) => void
  isCursor: boolean
  style?: React.CSSProperties
  className?: string
}

export function StartWorkBranchCreation(props: StartWorkContentProps) {
  const {
    issue,
    branches,
    currentBranch,
    initialBranchName,
    stashChanges,
    issueSettings,
    updateIssueSettings,
    isCursor,
    style,
    className,
  } = props

  const dialog = useDialog()

  const { update, workflowStates, cycles, workflowStatesLoading, cyclesLoading } = useIssueContext()

  const {
    branchesSettings: { updateCycle },
    branchesSettingsAreLoading,
  } = useSettings()

  const [isLoading, setIsLoading] = useState(false)
  const [branchName, setBranchName] = useState(initialBranchName)
  const [fromBranch, setFromBranch] = useState<Ref | null>(currentBranch || null)
  const [stateId, setStateId] = useState<SerializedIssue["stateId"] | undefined>()
  const [cycleId, setCycleId] = useState<SerializedIssue["cycleId"] | undefined>()
  const [useExistingBranch, setUseExistingBranch] = useState(false)

  const branchExists = useMemo(() => {
    if (!branchName) return false
    return branches?.some((b) => b.name === branchName)
  }, [branchName, branches])

  useEffect(() => {
    if (workflowStatesLoading || cyclesLoading) {
      setIsLoading(true)
      return
    }

    const initialState = getFirstStateOfType(workflowStates, "started")?.id || undefined
    if (initialState) {
      setStateId((prev) => (!prev || prev !== initialState ? initialState : prev))
    }

    const initialCycleId = cycles.find((c) => c.isActive)?.id || undefined
    if (initialCycleId) {
      setCycleId((prev) => (!prev || prev !== initialCycleId ? initialCycleId : prev))
    }

    setIsLoading(false)
  }, [workflowStatesLoading, cyclesLoading])

  function onReset() {
    setBranchName(initialBranchName)
    setFromBranch(currentBranch || null)
    setStateId(getFirstStateOfType(workflowStates, "started")?.id || undefined)
    setCycleId(cycles.find((c) => c.isActive)?.id || undefined)

    updateIssueSettings({
      branch: undefined,
      branchInitialized: false,
    })
  }

  useEffect(() => {
    if (issueSettings.branch?.name) {
      setBranchName(issueSettings.branch.name)
    }
  }, [issueSettings.branch?.name])

  if (isLoading || branchesSettingsAreLoading) {
    return null
  }

  if (issueSettings.branchInitialized && issueSettings.branch?.name) {
    const noNeedToCheckout = currentBranch?.name === issueSettings.branch!.name

    return (
      <div className={cx("startWorkContentInfoBox", className)} style={style}>
        <p
          style={{
            color: "var(--rs-text-secondary)",
          }}
        >
          Branch assigned to issue:
        </p>
        <Branch branch={issueSettings.branch} currentBranch={currentBranch} />
        <div style={{ marginTop: 30, display: "table", marginLeft: "auto" }}>
          <Button
            style={{ marginLeft: 10 }}
            onClick={async () => {
              const shouldChange = await dialog.confirm(
                "Are you sure you want to reset the branch settings? This will unbind the issue from the current branch.",
                {
                  title: "Reset Branch Settings",
                  okText: "Reset branch settings",
                  cancelText: "Cancel",
                  severity: "warning",
                },
              )
              if (shouldChange) onReset()
            }}
          >
            Reset branch settings
          </Button>
          {noNeedToCheckout ? (
            <Button
              onClick={update.panelActions.closePanel}
              appearance="primary"
              style={{ marginLeft: 10 }}
            >
              Close
            </Button>
          ) : (
            <CheckoutButton
              issue={issue}
              onClick={update.panelActions.closePanel}
              appearance="primary"
              stashChanges={stashChanges}
            />
          )}
          {isCursor ? (
            <Button
              className="startWorkAgentButton"
              style={{ marginLeft: 10 }}
              onClick={() => update.panelActions.launchCursorAgent(issue.id)}
            >
              Start work with agent
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <FormQueueAsync
      canRetry
      canRestart
      startButtonLabel={useExistingBranch ? "Start work" : "Create branch"}
      endButtonLabel="Close"
      onComplete={() => {
        update.panelActions.closePanel()
      }}
      onReset={onReset}
      actions={[
        <Button key="use-existing-branch" onClick={() => setUseExistingBranch((v) => !v)}>
          {useExistingBranch ? "Create a new branch" : "Use an existing branch"}
        </Button>,
      ]}
    >
      {useExistingBranch ? (
        <FormQueueField
          key="use-existing-branch"
          indexKey="use-existing-branch"
          label="Use existing branch"
          input={
            <BranchPicker
              branches={branches || []}
              branch={fromBranch}
              onChange={setFromBranch}
              currentBranch={currentBranch}
            />
          }
          onProcess={async () => {
            if (fromBranch) {
              await update.panelActions.checkout(fromBranch, stashChanges)
              updateIssueSettings({
                branch: fromBranch,
                branchInitialized: true,
              })
            } else {
              throw new Error("Branch is required")
            }
          }}
          showToggle={false}
        />
      ) : null}
      {!useExistingBranch ? (
        <FormQueueField
          key="branch-name"
          indexKey="branch-name"
          label="Branch name"
          errors={branchExists ? ["Branch name already exists"] : undefined}
          disabled={false}
          input={(expand) => (
            <BranchNameInput
              name={branchName}
              style={{ marginLeft: 10, width: "-webkit-fill-available" }}
              onChange={setBranchName}
              inline={!expand ? "text" : undefined}
            />
          )}
          onProcess={async () => {
            await validateBranchName(branchName)
          }}
          showToggle={false}
        />
      ) : null}
      {!useExistingBranch ? (
        <FormQueueField
          key="base-branch"
          indexKey="base-branch"
          label="Base branch"
          input={
            <BranchPicker
              branches={branches || []}
              branch={fromBranch}
              onChange={setFromBranch}
              currentBranch={currentBranch}
            />
          }
          onProcess={async () => {
            if (fromBranch) {
              const ref = await update.panelActions.createBranch(
                branchName,
                fromBranch,
                stashChanges,
              )
              updateIssueSettings({ branch: ref, branchInitialized: true })
            } else {
              throw new Error("Base branch is required")
            }
          }}
          showToggle={false}
        />
      ) : null}
      <FormQueueField
        key="issue-state"
        indexKey="issue-state"
        label="Update issue state to"
        disabled={stateId === issue.stateId || undefined}
        input={
          <WorkflowStatePicker
            issue={{ stateId } as SerializedIssue}
            onChange={setStateId}
            size={16}
          />
        }
        onProcess={() => update.issue(issue.id, { stateId: stateId })}
      />
      {!!updateCycle ? (
        <FormQueueField
          key="issue-cycle"
          indexKey="issue-cycle"
          label="Update cycle to"
          disabled={cycleId === issue.cycleId || undefined}
          input={
            <ProjectCyclePicker
              issue={{ cycleId } as SerializedIssue}
              onChange={(cycleId) => setCycleId(cycleId || undefined)}
              size={16}
            />
          }
          onProcess={() => update.issue(issue.id, { cycleId })}
        />
      ) : null}
    </FormQueueAsync>
  )
}

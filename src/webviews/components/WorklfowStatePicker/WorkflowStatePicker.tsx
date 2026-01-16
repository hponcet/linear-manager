import { useMemo } from "react";
import { SelectPicker, SelectPickerProps } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { WorkflowState } from "./WorkflowState";
import { Issue } from "@linear/sdk";
import { Tooltip } from "../Tooltip/Tooltip";

export type WorkflowStatePickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange"
> & {
  inline?: "text" | "icon";
  issue: Issue;
};

export function WorkflowStatePicker(props: WorkflowStatePickerProps) {
  const { style, className, issue, inline, ...selectPickerProps } = props;
  const { update, workflowStates, workflowStatesLoading } = useIssueContext();

  const data = useMemo(
    () =>
      workflowStates?.map((workflowState) => ({
        label: workflowState.name,
        value: workflowState.id,
        workflowState,
      })) || [],
    [workflowStates]
  );

  const workflowState = data.find(
    (state) => state.value === issue?.stateId
  )?.workflowState;

  return (
    <Tooltip
      tooltip={
        inline === "icon" ? (
          <WorkflowState workflowState={workflowState} />
        ) : undefined
      }
      delayOpen={0}
    >
      <span>
        <SelectPicker
          loading={workflowStatesLoading}
          data={data}
          style={style}
          className={className}
          value={data.find((state) => state.value === issue?.stateId)?.value}
          onChange={async (value) => {
            if (!value) return;
            await update.issue(issue.id, { stateId: value });
          }}
          renderOption={(_, item) => (
            <WorkflowState workflowState={item.workflowState} />
          )}
          renderValue={(_, item) => (
            <WorkflowState workflowState={item.workflowState} inline={inline} />
          )}
          cleanable={false}
          {...selectPickerProps}
        />
      </span>
    </Tooltip>
  );
}

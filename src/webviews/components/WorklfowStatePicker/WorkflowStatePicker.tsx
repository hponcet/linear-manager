import { useMemo } from "react";
import { SelectPicker } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { WorkflowState } from "./WorkflowState";

export type WorkflowStatePickerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function WorkflowStatePicker(props: WorkflowStatePickerProps) {
  const { style, className } = props;
  const { issue, update, workflowStates, workflowStatesLoading } =
    useIssueContext();

  const data = useMemo(
    () =>
      workflowStates?.map((workflowState) => ({
        label: workflowState.name,
        value: workflowState.id,
        workflowState,
      })) || [],
    [workflowStates]
  );

  return (
    <SelectPicker
      loading={workflowStatesLoading}
      data={data}
      style={style}
      className={className}
      value={data.find((state) => state.value === issue?.stateId)?.value}
      onChange={async (value) => {
        if (!value) return;
        await update.issue({ stateId: value });
      }}
      renderOption={(_, item) => (
        <WorkflowState workflowState={item.workflowState} />
      )}
      renderValue={(_, item) => (
        <WorkflowState workflowState={item.workflowState} />
      )}
      cleanable={false}
    />
  );
}

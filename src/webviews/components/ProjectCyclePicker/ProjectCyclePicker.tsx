import { useMemo } from "react";
import { SelectPicker, SelectPickerProps } from "rsuite";
import { Cycle, Issue } from "@linear/sdk";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

import { ProjectCycle } from "./ProjectCycle";
import { Tooltip } from "../Tooltip/Tooltip";

export type ProjectCyclePickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange"
> & {
  inline?: "text" | "icon";
  issue: Issue;
};

export function ProjectCyclePicker(props: ProjectCyclePickerProps) {
  const { issue, style, className, inline, ...selectPickerProps } = props;
  const { update, cycles, cyclesLoading } = useIssueContext();

  const data = useMemo(
    () => [
      {
        label: "No cycle",
        value: "no-cycle",
        cycle: null,
      },
      ...(cycles
        .map((cycle) => ({
          label: cycle.name || `Cycle ${cycle.number}`,
          value: cycle.id,
          cycle,
        }))
        .sort((a, b) => a.cycle.number - b.cycle.number) || []),
    ],
    [cycles]
  );

  const projectCycle =
    data.find((c) => c.value === issue.cycleId)?.cycle || null;

  return (
    <Tooltip
      tooltip={
        inline === "icon" ? (
          <ProjectCycle projectCycle={projectCycle} />
        ) : undefined
      }
      delayOpen={0}
    >
      <span>
        <SelectPicker
          loading={cyclesLoading}
          style={style}
          className={className}
          data={data}
          value={issue.cycleId || null}
          placeholder={<ProjectCycle projectCycle={null} inline={inline} />}
          onChange={(cycleId) =>
            update.issue(issue.id, {
              cycleId: cycleId === "no-cycle" ? null : cycleId,
            })
          }
          renderOption={(_, item: { cycle: Cycle | null }) => (
            <ProjectCycle projectCycle={item.cycle} showDate />
          )}
          renderValue={(_, item) => {
            if (!item) {
              return null;
            }
            return <ProjectCycle projectCycle={item.cycle} inline={inline} />;
          }}
          {...selectPickerProps}
        />
      </span>
    </Tooltip>
  );
}

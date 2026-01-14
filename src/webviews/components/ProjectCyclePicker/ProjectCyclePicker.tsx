import { useMemo } from "react";
import { SelectPicker } from "rsuite";
import { Cycle } from "@linear/sdk";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

import { ProjectCycle } from "./ProjectCycle";

export type ProjectCyclePickerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function ProjectCyclePicker(props: ProjectCyclePickerProps) {
  const { style, className } = props;
  const { issue, update, cycles, cyclesLoading } = useIssueContext();

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

  return (
    <SelectPicker
      loading={cyclesLoading}
      style={style}
      className={className}
      data={data}
      value={issue.cycleId || null}
      placeholder={<ProjectCycle projectCycle={null} />}
      onChange={(cycleId) =>
        update.issue({
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
        return <ProjectCycle projectCycle={item.cycle} />;
      }}
    />
  );
}

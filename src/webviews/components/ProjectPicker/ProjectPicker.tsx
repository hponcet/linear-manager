import { useMemo } from "react";
import { SelectPicker, SelectPickerProps } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Project } from "./Project";
import { Issue } from "@linear/sdk";
import { Tooltip } from "../Tooltip/Tooltip";

export type IssueProjectPickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "onChange"
> & {
  inline?: "text" | "icon";
  issue: Issue;
};

export function IssueProjectPicker(props: IssueProjectPickerProps) {
  const { style, className, issue, inline, ...selectPickerProps } = props;
  const { update, projects, projectsLoading } = useIssueContext();

  const data = useMemo(
    () => [
      {
        label: "No project",
        value: "no-project",
        project: null,
      },
      ...(projects
        ?.map((project) => ({
          label: project?.name,
          value: project?.id,
          project,
        }))
        .sort((a, b) => a.project?.name.localeCompare(b.project?.name)) || []),
    ],
    [projects]
  );

  const project =
    data?.find((p) => p?.value === issue.projectId)?.project || null;

  return (
    <Tooltip
      tooltip={inline === "icon" ? <Project project={project} /> : undefined}
      delayOpen={0}
    >
      <div>
        <SelectPicker
          loading={projectsLoading}
          style={{ ...style, maxWidth: 300 }}
          className={className}
          data={data}
          value={issue.projectId || null}
          placeholder={<Project project={null} inline={inline} />}
          onChange={(projectId) =>
            update.issue(issue.id, {
              projectId: projectId === "no-project" ? null : projectId,
            })
          }
          renderOption={(_, item) => <Project project={item.project} />}
          renderValue={(_, item) =>
            item ? <Project project={item.project} inline={inline} /> : null
          }
          {...selectPickerProps}
        />
      </div>
    </Tooltip>
  );
}

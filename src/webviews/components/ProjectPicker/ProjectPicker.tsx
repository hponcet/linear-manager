import { useMemo } from "react";
import { SelectPicker } from "rsuite";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Project } from "./Project";

export type IssueProjectPickerProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function IssueProjectPicker(props: IssueProjectPickerProps) {
  const { style, className } = props;
  const { issue, update, projects, projectsLoading } = useIssueContext();

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

  return (
    <SelectPicker
      loading={projectsLoading}
      style={{ ...style, maxWidth: 300 }}
      className={className}
      data={data}
      value={issue.projectId || null}
      placeholder={<Project project={null} />}
      onChange={(projectId) =>
        update.issue({
          projectId: projectId === "no-project" ? null : projectId,
        })
      }
      renderOption={(_, item) => <Project project={item.project} />}
      renderValue={(_, item) =>
        item ? <Project project={item.project} /> : null
      }
    />
  );
}

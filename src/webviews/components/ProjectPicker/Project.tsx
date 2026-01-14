import { ProjectIcon, ProjectIconProps } from "./ProjectIcon";
import { Project as LinearProject } from "@linear/sdk";

export type ProjectProps = ProjectIconProps & {
  style?: React.CSSProperties;
  className?: string;
  project: LinearProject | null;
  inline?: boolean;
};

export function Project(props: ProjectProps) {
  const {
    style,
    className,
    project,
    size = 16,
    color = "currentColor",
    inline,
  } = props;

  if (inline) {
    return project?.name || "No project";
  }

  return (
    <div
      style={{
        maxWidth: "100%",
        display: "inline-flex",
        alignItems: "center",
        minWidth: 100,
        opacity: project ? 1 : 0.5,
        ...style,
      }}
      className={className}
    >
      <ProjectIcon size={size} color={color} style={{ marginRight: 6 }} />
      <div
        style={{
          whiteSpace: "nowrap",
          maxWidth: "calc(100% - 22px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {project?.name || "No project"}
      </div>
    </div>
  );
}

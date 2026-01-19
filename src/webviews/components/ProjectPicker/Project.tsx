import { ProjectIcon, ProjectIconProps } from "./ProjectIcon";
import { Project as LinearProject } from "@linear/sdk";

export type ProjectProps = ProjectIconProps & {
  style?: React.CSSProperties;
  className?: string;
  project: LinearProject | null;
  inline?: "text" | "icon";
};

export function Project(props: ProjectProps) {
  const {
    style,
    className,
    project,
    size,
    color = "currentColor",
    inline,
  } = props;

  if (inline === "text") {
    return project?.name || "No project";
  } else if (inline === "icon") {
    return (
      <ProjectIcon
        size={size}
        color={color}
        style={{ ...style, opacity: project ? 1 : 0.5 }}
        className={className}
      />
    );
  }

  return (
    <div
      style={{
        maxWidth: "100%",
        display: "inline-flex",
        alignItems: "center",
        opacity: project ? 1 : 0.5,
        ...style,
      }}
      className={className}
    >
      <ProjectIcon size={size} color={color} style={{ marginRight: 6 }} />
      <div
        style={{
          whiteSpace: "nowrap",
          maxWidth: `calc(100% - ${size}px)`,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {project?.name || "No project"}
      </div>
    </div>
  );
}

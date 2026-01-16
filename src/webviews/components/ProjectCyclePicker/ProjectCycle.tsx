import { Cycle } from "@linear/sdk";
import { ProjectCycleIcon } from "./ProjectCycleIcon";

import "./ProjectCycle.css";
import moment from "moment";

export type ProjectCycleProps = {
  projectCycle: Cycle | null;
  style?: React.CSSProperties;
  className?: string;
  showDate?: boolean;
  inline?: "text" | "icon";
};

export function ProjectCycle(props: ProjectCycleProps) {
  const { style, className, projectCycle, showDate, inline } = props;

  function getLabel() {
    if (!projectCycle) {
      return "No cycle";
    } else {
      return projectCycle.name || `Cycle ${projectCycle.number}`;
    }
  }

  function getDateLabel() {
    if (projectCycle?.startsAt && projectCycle?.endsAt) {
      return `${moment(projectCycle.startsAt).format("MMM D")} - ${moment(
        projectCycle.endsAt
      ).format("MMM D")}`;
    }
    return null;
  }

  if (inline === "text") {
    return getLabel();
  } else if (inline === "icon") {
    return (
      <ProjectCycleIcon
        cycle={projectCycle}
        style={style}
        className={className}
      />
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        opacity: projectCycle ? 1 : 0.5,
        ...style,
      }}
      className={className}
    >
      <ProjectCycleIcon cycle={projectCycle} style={{ marginRight: 8 }} />
      <span>{getLabel()}</span>
      {showDate && projectCycle?.startsAt && projectCycle?.endsAt ? (
        <div className="cycleDates">
          {getDateLabel()}{" "}
          {projectCycle.isActive
            ? ` ・ Current`
            : projectCycle.isNext
            ? ` ・ Upcoming`
            : null}
        </div>
      ) : null}
    </div>
  );
}

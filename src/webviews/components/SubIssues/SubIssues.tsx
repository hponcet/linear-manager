import { useState } from "react";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Button } from "../Button/Button";
import { Animation } from "rsuite";
import { CaretIcon } from "../Icons/CaretIcon";
import { InlineIssue } from "../InlineIssue/InlineIssue";

import "./SubIssues.scss";
import { Separator } from "../Separator/Separator";

type SubIssuesProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function SubIssues(props: SubIssuesProps) {
  const { style, className } = props;

  const { subIssues } = useIssueContext();

  const [collapsed, setCollapsed] = useState(false);

  if (!subIssues || subIssues.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`subIssuesContainer ${className || ""}`} style={style}>
        <div>
          <Button
            onClick={() => setCollapsed(!collapsed)}
            className="subIssuesButton"
          >
            <CaretIcon
              style={{
                transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
                transition: "transform 0.3s",
                marginRight: 6,
              }}
            />
            <span>Sub-issues</span>
          </Button>
        </div>
        <Animation.Collapse in={!collapsed}>
          {(props, ref) => (
            <div
              ref={ref}
              {...props}
              className={`subIssuesList ${props.className || ""}`}
            >
              {subIssues.map((issue) => (
                <InlineIssue key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </Animation.Collapse>
      </div>
      <Separator />
    </>
  );
}

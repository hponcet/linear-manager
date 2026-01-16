import { IssueLabel } from "@linear/sdk";

import "./Label.scss";

type LabelProps = {
  issueLabel: IssueLabel;
  inline?: boolean;
};

export function Label(props: LabelProps) {
  const { issueLabel, inline } = props;

  if (inline) {
    return (
      <span is-inline="true" className="label">
        <span
          className="labelColor"
          is-inline="true"
          style={{ backgroundColor: issueLabel.color }}
        />
        {issueLabel.name}
      </span>
    );
  }

  return (
    <div is-inline="false" className="label">
      <div
        className="labelColor"
        style={{ backgroundColor: issueLabel.color }}
      />
      {issueLabel.name}
    </div>
  );
}

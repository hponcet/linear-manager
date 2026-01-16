import { Fragment, useState } from "react";
import moment from "moment";
import { UserAvatar } from "../UserAvatar/UserAvatar";

import {
  getActivity,
  getAllHistoryTypes,
  getHistoryType,
} from "../InlineIssue/historyUtils";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

import { History } from "src/webviews/utils/history";

import { Animation } from "rsuite";

import "./IssueHistory.scss";

type IssueHistoryProps = {
  history: History[];
  level?: number;
};

export function IssueHistory(props: IssueHistoryProps) {
  const { history, level = 0 } = props;

  const contextValues = useIssueContext();

  const [expand, setExpand] = useState(false);

  const activity = history[history.length - 1];

  if (!activity) {
    return null;
  }

  const historyTypes = getAllHistoryTypes(activity).sort((a, b) =>
    getHistoryType(a).localeCompare(getHistoryType(b))
  );

  if (historyTypes.length === 0) {
    return null;
  }

  const [content, icon] = getActivity(contextValues, activity);

  const shouldCollapse = level === 0 && history.length > 1;

  return (
    <>
      {shouldCollapse && (
        <Animation.Collapse in={expand}>
          {(props, ref) => (
            <div
              ref={ref}
              {...props}
              className={`issueHistoryExpandArea ${props.className || ""}`}
            >
              <div className="activityBreadcrumbTrail" style={{ left: 29 }} />
              {history.slice(0, history.length - 1).map((h) => (
                <IssueHistory key={h.id} history={[h]} level={1} />
              ))}
            </div>
          )}
        </Animation.Collapse>
      )}
      <div
        className="issueHistory"
        onClick={() => setExpand((v) => !v)}
        style={{
          cursor: shouldCollapse ? "pointer" : "default",
          paddingLeft: level * 20,
        }}
      >
        <div className="historyActivityLine">
          <div className="issueHistoryIcon">
            <div>
              {icon ||
                (activity.actor ? (
                  <UserAvatar
                    user={activity.actor}
                    size={14}
                    style={{ outline: "4px solid var(--bg-color)" }}
                  />
                ) : null)}
            </div>
          </div>
          <span className="issueHistoryContent">
            <span>{activity?.actor?.email}</span>
            {content.map((action, index) => {
              return (
                <Fragment key={String(index)}>
                  {action}
                  {content.length !== index + 1 ? <span> and </span> : null}
                </Fragment>
              );
            })}
            <span style={{ padding: "0 3px" }}>·</span>
            <span className="issueHistoryDate">
              {moment(activity.updatedAt).fromNow()} ago
            </span>
            {shouldCollapse && (
              <span className="issueHistoryExpandIndicator">
                {expand ? "▲" : `+ ${history.length - 1} more`}
              </span>
            )}
          </span>
        </div>
      </div>
    </>
  );
}

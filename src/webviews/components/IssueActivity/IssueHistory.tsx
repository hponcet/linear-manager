import { Fragment } from "react";
import moment from "moment";
import { UserAvatar } from "../UserAvatar/UserAvatar";

import {
  getActivity,
  getAllHistoryTypes,
  getHistoryType,
} from "./historyUtils";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

import { History } from "src/webviews/utils/history";

import "./IssueHistory.scss";

type IssueHistoryProps = {
  history: History[];
};

export function IssueHistory(props: IssueHistoryProps) {
  const { history } = props;

  const contextValues = useIssueContext();

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

  return (
    <div className="issueHistory">
      <div className="historyActivityLine">
        <div className="issueHistoryIcon">
          {icon ||
            (activity.actor ? (
              <UserAvatar
                user={activity.actor}
                size={14}
                style={{ outline: "4px solid var(--bg-color)" }}
              />
            ) : null)}
        </div>
        <div className="issueHistoryContent">
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
          <div className="issueHistoryDate">
            {/* format: 3h ago / 23d ago */}
            {moment(activity.updatedAt).fromNow()} ago
          </div>
        </div>
      </div>
    </div>
  );
}

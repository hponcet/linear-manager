import { User } from "@linear/sdk";
import { ReactNode } from "react";
import { UserAvatar } from "src/webviews/components/UserAvatar/UserAvatar";

type AssigneeProps = {
  style?: React.CSSProperties;
  className?: string;
  user?: User | null;
  label?: ReactNode;
  inline?: boolean;
};

export function Assignee(props: AssigneeProps) {
  const { style, className, user, label, inline } = props;

  if (inline) {
    return <>{label || user?.name || "No assignee"}</>;
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "start",
        opacity: user ? 1 : 0.5,
        ...style,
      }}
    >
      <UserAvatar user={user} size={16} style={{ marginRight: 8 }} />
      <div>{label || user?.name || "No assignee"}</div>
    </div>
  );
}

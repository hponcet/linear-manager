import { Attachment as LinearAttachment } from "@linear/sdk";
import { LinkIcon } from "../Icons/LinkIcon";
import { Menu } from "../Menu/Menu";
import { OpenExternalIcon } from "../Icons/OpenExternalIcon";
import moment from "moment";
import { EditIcon } from "../Icons/EditIcon";
import { TrashIcon } from "../Icons/TrashIcon";
import { useIssueContext } from "src/webviews/contexts/IssueContext";

import "./Attachment.scss";
import { useState } from "react";

type AttachmentProps = {
  style?: React.CSSProperties;
  className?: string;
  attachment: LinearAttachment;
  editAttachment: () => void;
};

export function Attachment(props: AttachmentProps) {
  const { style, className, attachment, editAttachment } = props;

  const { update } = useIssueContext();

  const [brokenIcon, setBrokenIcon] = useState(false);

  function getIcon() {
    if (brokenIcon || !attachment.url) {
      return <LinkIcon size={16} />;
    }

    return (
      <img
        onError={() => setBrokenIcon(true)}
        src={`https://favicone.com/${new URL(attachment.url).hostname}?s=16`}
        alt="icon"
        className="attachmentFavicon"
      />
    );
  }

  return (
    <div
      className={`attachmentContainer ${className || ""}`}
      style={style}
      onClick={() => update.panelActions.openExternalUrl(attachment.url)}
    >
      <div className="attachmentIcon">{getIcon()}</div>
      <div className="attachmentTitle">{attachment.title}</div>
      <div className="attachmentSubtitle">{attachment.subtitle}</div>
      <div className="attachmentUpdatedAt">
        {moment(attachment.createdAt).fromNow()}
      </div>
      <div className="attachmentActions" onClick={(e) => e.stopPropagation()}>
        <Menu
          items={[
            {
              label: "Open Link",
              action: () => update.panelActions.openExternalUrl(attachment.url),
              icon: <OpenExternalIcon size={14} />,
            },
            {
              label: "Copy link",
              action: () => navigator.clipboard.writeText(attachment.url),
              icon: <LinkIcon size={14} />,
            },
            "separator",
            {
              label: "Edit",
              action: editAttachment,
              icon: <EditIcon size={14} />,
            },
            "separator",
            {
              label: "Delete",
              action: () => update.attachments.delete(attachment.id),
              icon: <TrashIcon size={14} />,
            },
          ]}
        />
      </div>
    </div>
  );
}

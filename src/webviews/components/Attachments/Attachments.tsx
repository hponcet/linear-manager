import { useState } from "react"
import { Animation } from "rsuite"
import { useIssueContext } from "src/webviews/contexts/IssueContext"
import { useModalsContext } from "src/webviews/contexts/ModalsContext"

import { Attachment } from "./Attachment"

import { Button } from "../Button/Button"
import { CaretIcon } from "../Icons/CaretIcon"
import { PlusIcon } from "../Icons/PlusIcon"

import "./Attachments.scss"

type AttachmentsProps = {
  style?: React.CSSProperties
  className?: string
}

export function Attachments(props: AttachmentsProps) {
  const { style, className } = props

  const { attachments } = useIssueContext()
  const { setIsCreatingAttachment } = useModalsContext()

  const [collapsed, setCollapsed] = useState(false)

  if (attachments === null) {
    return null
  }

  return (
    <>
      <div className={`attachmentsContainer ${className || ""}`} style={style}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 10,
          }}
        >
          <Button
            onClick={() => setCollapsed(!collapsed)}
            appearance="subtle"
            className="attachmentsButton"
          >
            <CaretIcon
              style={{
                transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
                transition: "transform 0.3s",
                marginRight: 6,
              }}
            />
            <span>Resources</span>
          </Button>
          <Button
            onClick={() => setIsCreatingAttachment({})}
            className="attachmentsAddButton"
            icon={<PlusIcon size={14} />}
          />
        </div>
        <Animation.Collapse in={!collapsed}>
          {(props, ref) => (
            <div ref={ref} {...props}>
              <div className="attachmentsList">
                {attachments.length === 0 ? (
                  <div
                    style={{
                      color: "var(--rs-text-secondary)",
                      fontSize: "var(--font-size-xsmall)",
                    }}
                  >
                    No resources yet.
                  </div>
                ) : (
                  attachments.map((attachment) => (
                    <Attachment
                      key={attachment.id}
                      attachment={attachment}
                      editAttachment={() =>
                        setIsCreatingAttachment({
                          attachmentId: attachment.id,
                          title: attachment.title,
                          url: attachment.url,
                        })
                      }
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </Animation.Collapse>
      </div>
    </>
  )
}

import { useEffect, useState } from "react"
import { Button, Input, Modal } from "rsuite"
import { SerializedAttachment, SerializedIssue } from "src/types/SerializedLinear"

import { LinkIcon } from "../Icons/LinkIcon"

type AttachmentCreationModalProps = {
  issue: SerializedIssue
  attachmentId?: SerializedAttachment["id"]
  title?: string
  url?: string
  open?: boolean
  onClose: () => void
  onChange: (data: { attachmentId: string; title: string; url: string }) => void
}

export function AttachmentCreationModal(props: AttachmentCreationModalProps) {
  const { attachmentId, issue, title, url, open, onClose, onChange } = props

  const [titleValue, setTitleValue] = useState(title || "")
  const [urlValue, setUrlValue] = useState(url || "")

  useEffect(() => {
    if (open) {
      setTitleValue(title || "")
      setUrlValue(url || "")
    } else {
      setTitleValue("")
      setUrlValue("")
    }
  }, [title, url, open])

  return (
    <Modal open={open} onClose={onClose} size="sm" backdrop="static">
      <Modal.Header>
        <LinkIcon size={16} style={{ marginRight: 8 }} />
        <span>Add link to issue {issue.identifier}</span>
      </Modal.Header>
      <Modal.Body>
        <label
          style={{
            fontWeight: "bolder",
            color: "var(--rs-text-primary)",
          }}
        >
          URL
        </label>
        <Input
          style={{
            margin: "5px 0 16px",
            border: "1px solid var(--rs-border-primary) !important",
            padding: 8,
          }}
          type="url"
          value={urlValue}
          onChange={setUrlValue}
          placeholder="https://..."
        />
        <label
          style={{
            fontWeight: "bolder",
            color: "var(--rs-text-primary)",
          }}
        >
          Title{" "}
          <span
            style={{
              color: "var(--rs-text-secondary)",
              fontSize: "var(--font-size-small)",
              fontWeight: "var(--font-weight-light)",
            }}
          >
            (optional)
          </span>
        </label>
        <Input
          type="text"
          value={titleValue}
          onChange={setTitleValue}
          style={{
            margin: "5px 0 16px",
            border: "1px solid var(--rs-border-primary) !important",
            padding: 8,
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">
          Cancel
        </Button>
        <Button
          appearance="primary"
          onClick={() => {
            onChange({
              attachmentId: attachmentId || "",
              title: titleValue || "",
              url: urlValue || "",
            })
            onClose()
          }}
        >
          {attachmentId ? "Update Link" : "Add Link"}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

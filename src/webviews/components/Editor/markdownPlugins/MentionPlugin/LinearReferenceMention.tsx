import { NodeViewWrapper } from "@tiptap/react"
import { useEffect, useState } from "react"
import { LinearReferenceCard } from "src/linear/LinearService"
import { vscApi } from "src/webviews/hooks/useRequestDataUpdate"

import { parseLinearMentionUrl } from "./LinearMention"
import { linearReferenceAttributes } from "./linearReferenceAttributes"
import { resolveLinearReference } from "./LinearReferenceHoverCard"
import { LinearReferenceIcon } from "./LinearReferenceIcon"

import type { LinearMentionKind } from "./LinearMention"
import type { ReactNodeViewProps } from "@tiptap/react"

function attributeText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/**
 * One reference chip, laid out the way Linear renders it inline: an issue shows its state
 * ring, its identifier in muted text and then its title; every other entity shows its icon
 * and its name. The resolved entity is only ever read, never written to the document.
 */
export function LinearReferenceMention(props: ReactNodeViewProps<HTMLElement>) {
  const { node } = props
  const kind = attributeText(node.attrs.kind)
  const id = attributeText(node.attrs.id)
  const label = attributeText(node.attrs.label) || id
  const notify = node.attrs.notify === true
  const resourceUrl = parseLinearMentionUrl(attributeText(node.attrs.resourceUrl))?.resourceUrl
  const [card, setCard] = useState<LinearReferenceCard | null>(null)

  useEffect(() => {
    if (!kind || !id) return

    let active = true
    void resolveLinearReference({ kind: kind as LinearMentionKind, id, label }).then((resolved) => {
      if (active) setCard(resolved)
    })

    return () => {
      active = false
    }
  }, [id, kind, label])

  if (kind === "user") {
    return (
      <NodeViewWrapper
        as="span"
        {...linearReferenceAttributes({ kind, id, label })}
        data-type="mention"
        data-notify={notify ? "true" : undefined}
        contentEditable={false}
      >
        {`@${card?.title || label}`}
      </NodeViewWrapper>
    )
  }

  // The document already carries the identifier, so the chip never waits on the API for it.
  const identifier = kind === "issue" ? card?.identifier || label : undefined
  const name = kind === "issue" ? card?.subtitle : card?.title
  const Tag = resourceUrl ? "a" : "span"

  return (
    <NodeViewWrapper
      as={Tag}
      {...linearReferenceAttributes({ kind, id, label })}
      data-type="mention"
      data-resource-url={resourceUrl}
      href={resourceUrl}
      rel={resourceUrl ? "noopener noreferrer nofollow" : undefined}
      contentEditable={false}
      onClick={(event: React.MouseEvent) => {
        // A node view sits outside the editor's delegated link handler, so following the
        // href here would navigate the whole webview away from the extension.
        event.preventDefault()
        event.stopPropagation()

        // An issue opens in its own webview; everything else has no in-editor view yet.
        if (kind === "issue") {
          void vscApi.postMessage({ type: "openIssue", issueId: card?.id || id })
          return
        }

        if (resourceUrl) void vscApi.postMessage({ type: "openExternalUrl", url: resourceUrl })
      }}
    >
      <LinearReferenceIcon kind={kind} card={card} />
      {identifier ? <span className="linear-reference-identifier">{identifier}</span> : null}
      {name || !identifier ? <span className="linear-reference-label">{name || label}</span> : null}
    </NodeViewWrapper>
  )
}

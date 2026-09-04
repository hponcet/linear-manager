import { NodeViewWrapper } from "@tiptap/react"

import { usePrivateLinearAssetUrl } from "../usePrivateLinearAssetUrl"

import type { ReactNodeViewProps } from "@tiptap/react"

export function AudioPlayer({ node }: ReactNodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : ""
  const title =
    typeof node.attrs.title === "string" && node.attrs.title.trim() ? node.attrs.title : "Audio"
  const asset = usePrivateLinearAssetUrl(src)

  if (!src) {
    return null
  }

  if (asset.status === "loading") {
    return (
      <NodeViewWrapper as="span" contentEditable={false} role="status">
        Loading audio…
      </NodeViewWrapper>
    )
  }

  if (asset.status === "error") {
    return (
      <NodeViewWrapper as="span" contentEditable={false} role="alert">
        Could not load {title}.{" "}
        <button type="button" onClick={asset.retry}>
          Retry
        </button>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper as="span" contentEditable={false}>
      <audio controls preload="metadata" src={asset.url} aria-label={title} title={title}>
        <a href={asset.url}>{`Open ${title}`}</a>
      </audio>
    </NodeViewWrapper>
  )
}

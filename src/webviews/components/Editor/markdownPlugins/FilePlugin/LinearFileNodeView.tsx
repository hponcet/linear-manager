import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"

import { formatFileSize } from "./formatFileSize"
import { LinearFile, normalizeLinearFileAttributes } from "./LinearFile"

import { usePrivateLinearAssetUrl } from "../usePrivateLinearAssetUrl"

import type { ReactNodeViewProps } from "@tiptap/react"

export function LinearFileRenderer({ node }: ReactNodeViewProps<HTMLDivElement>) {
  const file = normalizeLinearFileAttributes(node.attrs)
  const asset = usePrivateLinearAssetUrl(file?.href ?? "")

  if (!file) {
    return (
      <NodeViewWrapper role="alert" contentEditable={false}>
        Unavailable file
      </NodeViewWrapper>
    )
  }

  if (asset.status === "loading") {
    return (
      <NodeViewWrapper role="status" contentEditable={false}>
        Loading {file.name}…
      </NodeViewWrapper>
    )
  }

  if (asset.status === "error") {
    return (
      <NodeViewWrapper role="alert" contentEditable={false}>
        Could not load {file.name}.{" "}
        <button type="button" onClick={asset.retry}>
          Retry
        </button>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper contentEditable={false}>
      <a
        className="linear-file-card"
        href={asset.url}
        download={file.name}
        rel="noopener noreferrer nofollow"
        aria-label={`Download ${file.name}`}
        // ProseMirror suppresses the anchor's own navigation inside a node view, so clicking the
        // card would do nothing. Trigger the download explicitly instead.
        onClick={(event) => {
          event.preventDefault()

          const anchor = document.createElement("a")
          anchor.href = asset.url
          anchor.download = file.name
          anchor.rel = "noopener noreferrer nofollow"
          anchor.click()
        }}
      >
        <span className="linear-file-card__text">
          <span className="linear-file-card__name">{file.name}</span>
          {file.size === null ? null : (
            <span className="linear-file-card__metadata" aria-hidden="true">
              {formatFileSize(file.size)}
            </span>
          )}
        </span>
      </a>
    </NodeViewWrapper>
  )
}

export const LinearFileWithNodeView = LinearFile.extend({
  addNodeView() {
    return ReactNodeViewRenderer(LinearFileRenderer)
  },
})

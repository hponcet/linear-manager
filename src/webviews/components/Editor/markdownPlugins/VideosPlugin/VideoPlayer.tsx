import { NodeViewWrapper } from "@tiptap/react"
import { SyntheticEvent, useCallback, useState } from "react"
import ReactPlayer from "react-player"

import { getLoomEmbedUrl } from "./videoMarkdownDetection"
import { scaleVideoDimensions } from "./videoPlayerLayout"

import { usePrivateLinearAssetUrl } from "../usePrivateLinearAssetUrl"

import type { ReactNodeViewProps } from "@tiptap/react"

import "./VideoPlayer.scss"

export default function VideoPlayer(props: ReactNodeViewProps<HTMLLabelElement>) {
  const src = typeof props.node.attrs.src === "string" ? props.node.attrs.src : ""
  const title = typeof props.node.attrs.title === "string" ? props.node.attrs.title : ""
  const loomEmbedUrl = getLoomEmbedUrl(src)
  const asset = usePrivateLinearAssetUrl(src)
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null)

  const handleLoadedMetadata = useCallback((event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    const { videoWidth, videoHeight } = video
    if (!videoWidth || !videoHeight) {
      return
    }

    const maxWidth = video.parentElement?.clientWidth || videoWidth
    setLayout(scaleVideoDimensions(videoWidth, videoHeight, maxWidth))
  }, [])

  if (!src) {
    return null
  }

  if (asset.status === "loading") {
    return (
      <NodeViewWrapper as="span" contentEditable={false} role="status">
        Loading video…
      </NodeViewWrapper>
    )
  }

  if (asset.status === "error") {
    return (
      <NodeViewWrapper as="span" contentEditable={false} role="alert">
        Could not load this video.{" "}
        <button type="button" onClick={asset.retry}>
          Retry
        </button>
      </NodeViewWrapper>
    )
  }

  // An uploaded asset Linear labelled after its own URL says nothing about its format, so
  // the downloaded media type is the only way to keep a non-video upload out of the player.
  if (asset.mimeType && !asset.mimeType.startsWith("video/")) {
    return (
      <NodeViewWrapper as="span" contentEditable={false}>
        <a href={src} target="_blank" rel="noopener noreferrer nofollow">
          {title || src}
        </a>
      </NodeViewWrapper>
    )
  }

  if (loomEmbedUrl) {
    return (
      <NodeViewWrapper
        as="span"
        className="videoPlayerWrapper"
        contentEditable={false}
        role="group"
        aria-label={title || "Video"}
      >
        <iframe
          src={loomEmbedUrl}
          title={title || "Loom video"}
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-same-origin allow-scripts allow-presentation"
        />
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      as="span"
      className="videoPlayerWrapper"
      role="group"
      aria-label={title || "Video"}
      style={
        layout
          ? {
              width: layout.width,
              height: layout.height,
            }
          : undefined
      }
    >
      <ReactPlayer
        src={asset.url}
        controls
        playsInline
        title={title}
        width={layout?.width ?? "100%"}
        height={layout?.height ?? "auto"}
        onLoadedMetadata={handleLoadedMetadata}
      />
    </NodeViewWrapper>
  )
}

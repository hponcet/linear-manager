import { NodeViewWrapper } from "@tiptap/react"
import { SyntheticEvent, useCallback, useState } from "react"
import ReactPlayer from "react-player"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { scaleVideoDimensions } from "./videoPlayerLayout"

import type { ReactNodeViewProps } from "@tiptap/react"

import "./VideoPlayer.scss"

export default function VideoPlayer(props: ReactNodeViewProps<HTMLLabelElement>) {
  const src = props.node.attrs.src ?? ""
  const { linearAccessToken } = useIssueContext()
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

  return (
    <NodeViewWrapper
      className="videoPlayerWrapper"
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
        src={src}
        controls
        playsInline
        title={props.node.attrs.title}
        width={layout?.width ?? "100%"}
        height={layout?.height ?? "auto"}
        onLoadedMetadata={handleLoadedMetadata}
        config={{
          hls: {
            debug: false,
            xhrSetup: (xhr: XMLHttpRequest) => {
              xhr.setRequestHeader("Authorization", `Bearer ${linearAccessToken}`)
            },
          },
        }}
      />
    </NodeViewWrapper>
  )
}

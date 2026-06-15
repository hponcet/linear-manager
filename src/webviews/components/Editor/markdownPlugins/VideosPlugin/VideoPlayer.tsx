import { NodeViewWrapper } from "@tiptap/react"
import { useEffect, useState } from "react"
import { Loader } from "rsuite"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { lookupVideoMimeType } from "./videoMimeType"

import type { ReactNodeViewProps } from "@tiptap/react"
import type ReactPlayerType from "react-player"

import "./VideoPlayer.scss"

export default function VideoPlayer(props: ReactNodeViewProps<HTMLLabelElement>) {
  const mimeType = lookupVideoMimeType(props.node.attrs.src)
  const { linearAccessToken } = useIssueContext()
  const [ReactPlayer, setReactPlayer] = useState<typeof ReactPlayerType | null>(null)

  useEffect(() => {
    let cancelled = false

    void import("react-player").then((module) => {
      if (!cancelled) {
        setReactPlayer(() => module.default)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <NodeViewWrapper className="videoPlayerWrapper">
      {ReactPlayer ? (
        <ReactPlayer
          controls
          title={props.node.attrs.title}
          style={{ width: "auto", height: "auto", aspectRatio: "16/9" }}
          config={{
            hls: {
              debug: false,
              xhrSetup: function (xhr) {
                xhr.setRequestHeader("Authorization", `Bearer ${linearAccessToken}`)
              },
            },
          }}
        >
          <source src={props.node.attrs.src} type={mimeType} />
        </ReactPlayer>
      ) : (
        <div className="videoPlayerWrapper__loading" aria-busy="true">
          <Loader size="sm" />
        </div>
      )}
    </NodeViewWrapper>
  )
}

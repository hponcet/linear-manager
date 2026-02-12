import { NodeViewWrapper } from "@tiptap/react"
import mime from "mime-types"
import ReactPlayer from "react-player"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import type { ReactNodeViewProps } from "@tiptap/react"

import "./VideoPlayer.scss"

export default function VideoPlayer(props: ReactNodeViewProps<HTMLLabelElement>) {
  const mimeType = mime.lookup(props.node.attrs.src)

  const { linearAccessToken } = useIssueContext()

  return (
    <NodeViewWrapper className="videoPlayerWrapper">
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
        <source src={props.node.attrs.src} type={mimeType || "video/mp4"} />
      </ReactPlayer>
    </NodeViewWrapper>
  )
}

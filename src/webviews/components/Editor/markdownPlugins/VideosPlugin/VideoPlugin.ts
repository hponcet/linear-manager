import { ReactNodeViewRenderer } from "@tiptap/react"

import { LinearVideo } from "./LinearVideo"
import VideoPlayer from "./VideoPlayer"

export const Video = LinearVideo.extend({
  addNodeView() {
    return ReactNodeViewRenderer(VideoPlayer)
  },
})

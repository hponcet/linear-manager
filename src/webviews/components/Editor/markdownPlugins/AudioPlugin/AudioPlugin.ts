import { ReactNodeViewRenderer } from "@tiptap/react"

import { AudioPlayer } from "./AudioPlayer"
import { LinearAudio } from "./LinearAudio"

export const Audio = LinearAudio.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AudioPlayer)
  },
})

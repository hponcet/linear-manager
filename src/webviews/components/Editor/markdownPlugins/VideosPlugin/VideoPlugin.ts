import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { find, reset } from "linkifyjs"

import VideoPlayer from "./VideoPlayer"

const videoExtensions = ["mp4", "webm", "ogg", "mov", "mkv"]
const videoRegex = new RegExp(`\\.(${videoExtensions.join("|")})(\\?.*)?$`)

export const Video = Node.create({
  name: "video",

  priority: 1005,

  draggable: false,

  atom: true,

  onDestroy() {
    reset()
  },

  addOptions() {
    return {
      HTMLAttributes: {
        class: null,
      },
    }
  },

  parseHTML() {
    return [{ tag: "video[src]" }]
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML(element) {
          return element.getAttribute("src")
        },
      },
      class: {
        default: this.options.HTMLAttributes.class,
      },
      title: {
        default: null,
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  markdownTokenName: "video",

  markdownTokenizer: {
    name: "video",
    level: "inline",
    start(src) {
      const match = find(src)[0]
      if (match && match.isLink && match.value.match(videoRegex)) {
        return match.start
      }
      return -1
    },
    tokenize(source) {
      const match = find(source)[0]

      if (!match) {
        return undefined
      }

      const matchText = /\[(?<title>.*?)\]\((?<url>.*?)\)/g.exec(source)
      const { title, url } = matchText?.groups || {}
      const extension = videoRegex.exec(title)

      if (!extension) {
        return undefined
      }

      const src = url

      return {
        type: "video",
        raw: source.slice(0, match.end + 1),
        src,
        title,
      }
    },
  },

  parseMarkdown: (token, helpers) => {
    return helpers.createNode("video", {
      src: token.src,
      title: token.title,
    })
  },

  renderMarkdown: (node) => {
    const src = node.attrs?.src ?? ""
    const title = node.attrs?.title ?? ""

    return `[${title}](${src})`
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoPlayer)
  },
})

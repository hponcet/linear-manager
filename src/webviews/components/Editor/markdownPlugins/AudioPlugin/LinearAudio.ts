import { mergeAttributes, Node } from "@tiptap/core"

import { findAudioMarkdown, parseAudioMarkdown } from "./audioMarkdownDetection"

import {
  escapeMarkdownLabel,
  formatMarkdownDestination,
  formatMarkdownTitle,
} from "../../markdownEscaping"
import { serializeLinearMediaEmbed } from "../LinearMediaEmbed"
import { getCanonicalPrivateLinearAssetUrl } from "../privateLinearImageUrl"

export const LinearAudio = Node.create({
  name: "audio",

  priority: 1006,

  inline: true,

  group: "inline",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("title") ?? "",
      },
      destinationTitle: {
        default: null,
        rendered: false,
      },
      uploadState: {
        default: null,
        rendered: false,
      },
      size: {
        default: null,
        rendered: false,
      },
      mimetype: {
        default: null,
        rendered: false,
      },
      controls: {
        default: true,
        rendered: false,
      },
      syntax: {
        default: "markdown",
        rendered: false,
      },
    }
  },

  parseHTML() {
    return [{ tag: "audio[src]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { controls: "controls" }),
    ]
  },

  markdownTokenName: "audio",

  markdownTokenizer: {
    name: "audio",
    level: "inline",
    start: findAudioMarkdown,
    tokenize(source) {
      const audio = parseAudioMarkdown(source)
      return audio ? { type: "audio", ...audio } : undefined
    },
  },

  parseMarkdown(token, helpers) {
    const source = typeof token.src === "string" ? token.src : ""
    return helpers.createNode("audio", {
      src: getCanonicalPrivateLinearAssetUrl(source) ?? source,
      title: token.title ?? "",
      destinationTitle: token.destinationTitle ?? null,
      uploadState: token.uploadState ?? null,
      size: token.size ?? null,
      mimetype: token.mimetype ?? null,
      controls: token.controls ?? true,
      syntax: token.syntax ?? "markdown",
    })
  },

  renderMarkdown(node) {
    if (node.attrs?.syntax === "linearEmbed") {
      return serializeLinearMediaEmbed("audio", node.attrs) ?? ""
    }

    const source = typeof node.attrs?.src === "string" ? node.attrs.src : ""
    const src = getCanonicalPrivateLinearAssetUrl(source) ?? source
    const title = node.attrs?.title ?? ""
    const destinationTitle = node.attrs?.destinationTitle

    return `![${escapeMarkdownLabel(title)}](${formatMarkdownDestination(src)}${formatMarkdownTitle(destinationTitle)})`
  },
})

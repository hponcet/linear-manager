import { Node, mergeAttributes } from "@tiptap/core"

import { findVideoMarkdown, parseVideoMarkdown } from "./videoMarkdownDetection"

import {
  escapeMarkdownLabel,
  formatMarkdownDestination,
  formatMarkdownTitle,
} from "../../markdownEscaping"
import { serializeLinearMediaEmbed } from "../LinearMediaEmbed"
import { getCanonicalPrivateLinearAssetUrl } from "../privateLinearImageUrl"

import type { VideoMarkdownSyntax } from "./videoMarkdownDetection"

export const LinearVideo = Node.create({
  name: "video",

  priority: 1005,

  inline: true,

  group: "inline",

  draggable: false,

  atom: true,

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
        parseHTML: (element) => element.getAttribute("src"),
      },
      class: {
        default: this.options.HTMLAttributes.class,
      },
      title: {
        default: null,
      },
      destinationTitle: {
        default: null,
        rendered: false,
      },
      syntax: {
        default: "link",
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
      height: {
        default: null,
        rendered: false,
      },
      width: {
        default: null,
        rendered: false,
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  markdownTokenName: "video",

  markdownTokenizer: {
    name: "video",
    level: "inline",
    start: findVideoMarkdown,
    tokenize(source) {
      const video = parseVideoMarkdown(source)
      return video ? { type: "video", ...video } : undefined
    },
  },

  parseMarkdown: (token, helpers) => {
    const source = typeof token.src === "string" ? token.src : ""
    return helpers.createNode("video", {
      src: getCanonicalPrivateLinearAssetUrl(source) ?? source,
      title: token.title || null,
      destinationTitle: token.destinationTitle || null,
      syntax: token.syntax,
      uploadState: token.uploadState ?? null,
      size: token.size ?? null,
      mimetype: token.mimetype ?? null,
      controls: token.controls ?? true,
      height: token.height ?? null,
      width: token.width ?? null,
    })
  },

  renderMarkdown: (node) => {
    if (node.attrs?.syntax === "linearEmbed") {
      return serializeLinearMediaEmbed("video", node.attrs) ?? ""
    }

    const source = typeof node.attrs?.src === "string" ? node.attrs.src : ""
    const src = getCanonicalPrivateLinearAssetUrl(source) ?? source
    const title = node.attrs?.title ?? ""
    const destinationTitle = node.attrs?.destinationTitle
    const syntax = node.attrs?.syntax as VideoMarkdownSyntax | undefined
    const markdown = `[${escapeMarkdownLabel(title)}](${formatMarkdownDestination(src)}${formatMarkdownTitle(destinationTitle)})`

    return syntax === "embed" ? `!${markdown}` : markdown
  },
})

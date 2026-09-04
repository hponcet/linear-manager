import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { common, createLowlight } from "lowlight"

import { MermaidCodeBlockView } from "./MermaidCodeBlockView"

const lowlight = createLowlight({
  bash: common.bash,
  css: common.css,
  graphql: common.graphql,
  javascript: common.javascript,
  json: common.json,
  markdown: common.markdown,
  typescript: common.typescript,
  xml: common.xml,
})

lowlight.registerAlias({
  bash: ["sh", "shell"],
  javascript: ["js", "jsx"],
  markdown: ["md"],
  typescript: ["ts", "tsx"],
  xml: ["html", "svg"],
})

export const LinearCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MermaidCodeBlockView)
  },
}).configure({ lowlight })

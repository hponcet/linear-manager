import { HardBreak } from "@tiptap/extension-hard-break"

export const LinearHardBreak = HardBreak.extend({
  renderMarkdown() {
    return "\n"
  },
})

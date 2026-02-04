import { history } from "prosemirror-history"
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  MarkdownParser,
  MarkdownSerializer,
  schema as markdownSchema,
} from "prosemirror-markdown"
import { Schema } from "prosemirror-model"
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { useEffect, useRef } from "react"

import placeholderPlugin from "./plugins/placeholder"

import "prosemirror-view/style/prosemirror.css"

import "./IssueTitleInput.scss"

export type TextEditorProps = {
  value?: string
  placeholder?: string
  deleted?: boolean | null
  onSave?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  style?: React.CSSProperties
  className?: string
}

const schema = new Schema({
  nodes: markdownSchema.spec.nodes,
  marks: markdownSchema.spec.marks,
})

const mdSerializer = new MarkdownSerializer(
  defaultMarkdownSerializer.nodes,
  defaultMarkdownSerializer.marks,
)

const mdParser = new MarkdownParser(
  schema,
  defaultMarkdownParser.tokenizer,
  defaultMarkdownParser.tokens,
)

export function IssueTitleInput(props: TextEditorProps) {
  const { value = "", placeholder, onBlur, onFocus, onSave, style, className, deleted } = props

  const editorEl = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)

  function handleSave() {
    const value = mdSerializer.serialize(view.current!.state.doc)
    if (value !== value) {
      onSave?.(value)
    }
  }

  function handleFocus() {
    onFocus?.()
  }

  function handleBlur() {
    handleSave()
    onBlur?.()
  }

  useEffect(() => {
    const plugins = [placeholderPlugin(placeholder ?? "Issue title"), history()]

    const state = EditorState.create({
      schema,
      doc: mdParser.parse(value),
      plugins: plugins,
    })
    const currView = new EditorView(editorEl.current!, {
      state,
      editable() {
        return false
      },
    })
    view.current = currView
    view.current.dom.addEventListener("focus", handleFocus)
    view.current.dom.addEventListener("blur", handleBlur)
    return () => {
      view.current?.dom.removeEventListener("focus", handleFocus)
      view.current?.dom.removeEventListener("blur", handleBlur)
      currView.destroy()
    }
  }, [value])

  return (
    <div
      className={`linear-issue-title-input ${deleted ? "deleted" : ""} ${className || ""}`}
      style={style}
      ref={editorEl}
    />
  )
}

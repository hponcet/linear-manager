import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { useEffect, useId, useState } from "react"

import type { ReactNodeViewProps } from "@tiptap/react"

type MermaidState =
  | { status: "idle" | "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; message: string }

export function MermaidCodeBlockView(props: ReactNodeViewProps<HTMLDivElement>) {
  const { editor, node } = props
  const language = node.attrs.language as string | null
  const source = node.textContent
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const [state, setState] = useState<MermaidState>({ status: "idle" })
  // A diagram the author just created has nothing to preview, so it opens on its source;
  // otherwise the caret would land in a hidden block.
  const [editing, setEditing] = useState(() => !source.trim())

  useEffect(() => {
    if (language !== "mermaid" || !source.trim()) {
      setState({ status: "idle" })
      return
    }

    let cancelled = false
    setState({ status: "loading" })

    void import("mermaid")
      .then(async ({ default: mermaid }) => {
        // Without suppressErrorRendering, an invalid diagram leaves Mermaid's own
        // "Syntax error" graphic appended to the document body, outside this view.
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "dark",
          suppressErrorRendering: true,
        })
        const result = await mermaid.render(`linear-mermaid-${reactId}`, source)
        if (!cancelled) {
          setState({ status: "ready", svg: result.svg })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Invalid Mermaid diagram",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [language, reactId, source])

  // A diagram that fails to render has nothing to show but its source, and it stays open
  // afterwards: hiding it the moment the syntax becomes valid would pull the block away
  // from under the cursor mid-edit.
  useEffect(() => {
    if (state.status === "error") setEditing(true)
  }, [state.status])

  const isDiagram = language === "mermaid"
  // A diagram shows either its picture or its source, never both — except a broken one,
  // whose source stays readable even in the read-only reader.
  const showSource = !isDiagram || state.status === "error" || (editor.isEditable && editing)
  const showPreview = isDiagram && !showSource

  return (
    <NodeViewWrapper className="linear-code-block" data-language={language || undefined}>
      {/* Every child stays mounted and is only hidden: adding or removing a sibling around
          NodeViewContent rebuilds ProseMirror's content DOM and drops the block's text. */}
      <button
        type="button"
        className="linear-mermaid-toggle"
        contentEditable={false}
        hidden={!isDiagram || !editor.isEditable || state.status === "error"}
        aria-pressed={editing}
        // Keep the editor selection where it is: the switch is chrome, not content.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setEditing((current) => !current)}
      >
        {editing ? "View diagram" : "Edit diagram"}
      </button>
      <div className="linear-mermaid-preview" hidden={!showPreview} aria-live="polite">
        {state.status === "loading" ? <span>Rendering diagram…</span> : null}
        {state.status === "ready" ? (
          <div
            role="img"
            aria-label="Mermaid diagram"
            // Mermaid's strict security mode sanitizes the generated SVG.
            dangerouslySetInnerHTML={{ __html: state.svg }}
          />
        ) : null}
      </div>
      {isDiagram && state.status === "error" ? (
        <span className="linear-mermaid-error">{state.message}</span>
      ) : null}
      <pre hidden={!showSource}>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}

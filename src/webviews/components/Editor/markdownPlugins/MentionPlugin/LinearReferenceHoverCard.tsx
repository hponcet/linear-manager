import { useEffect, useRef, useState } from "react"
import { LinearReferenceCard } from "src/linear/LinearService"
import { vscApi } from "src/webviews/hooks/useRequestDataUpdate"

import { LINEAR_REFERENCE_ATTRIBUTE, readLinearReferenceTarget } from "./linearReferenceAttributes"

import type { LinearReferenceTarget } from "./linearReferenceAttributes"

import "./LinearReferenceHoverCard.scss"

type CardState = "loading" | "ready" | "unresolved"

type HoverState = {
  target: LinearReferenceTarget
  rect: DOMRect
  status: CardState
  card: LinearReferenceCard | null
}

const KIND_LABELS: Record<string, string> = {
  user: "User",
  issue: "Issue",
  project: "Project",
  document: "Document",
  cycle: "Cycle",
  milestone: "Milestone",
  view: "View",
  initiative: "Initiative",
}

// One resolution per reference for the lifetime of the webview; the extension host caches
// the Linear response as well, so a hovered reference costs at most one round trip.
const cache = new Map<string, Promise<LinearReferenceCard | null>>()

export function resolveLinearReference(
  target: LinearReferenceTarget,
): Promise<LinearReferenceCard | null> {
  const key = `${target.kind}:${target.id}`
  const cached = cache.get(key)
  if (cached) return cached

  const pending = vscApi
    .postMessage({ type: "resolveEditorReference", kind: target.kind, id: target.id })
    .catch(() => null)
  cache.set(key, pending)
  return pending
}

export function clearLinearReferenceCache(): void {
  cache.clear()
}

/**
 * Renders the shared hover card for every reference inside `container`. Hover is delegated
 * from the editor root so entity mentions, which are nodes, and bare handles, which are
 * decorations over plain text, get exactly the same card.
 */
export function LinearReferenceHoverCard(props: { container: HTMLElement | null }) {
  const { container } = props
  const [hover, setHover] = useState<HoverState | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!container) return

    const cancelHide = () => {
      if (hideTimer.current !== undefined) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = undefined
      }
    }

    const handleEnter = (event: Event) => {
      const element =
        event.target instanceof Element
          ? event.target.closest(`[${LINEAR_REFERENCE_ATTRIBUTE}]`)
          : null
      const target = element ? readLinearReferenceTarget(element) : null
      if (!element || !target) return

      cancelHide()
      const rect = element.getBoundingClientRect()
      setHover({ target, rect, status: "loading", card: null })

      void resolveLinearReference(target).then((card) => {
        setHover((current) =>
          current?.target.kind === target.kind && current.target.id === target.id
            ? { ...current, status: card ? "ready" : "unresolved", card }
            : current,
        )
      })
    }

    const handleLeave = (event: Event) => {
      const related = (event as MouseEvent).relatedTarget
      if (related instanceof Element && related.closest(".linear-reference-card")) return

      cancelHide()
      hideTimer.current = window.setTimeout(() => setHover(null), 120)
    }

    const hide = () => setHover(null)
    container.addEventListener("mouseover", handleEnter)
    container.addEventListener("mouseout", handleLeave)
    window.addEventListener("scroll", hide, true)

    return () => {
      cancelHide()
      container.removeEventListener("mouseover", handleEnter)
      container.removeEventListener("mouseout", handleLeave)
      window.removeEventListener("scroll", hide, true)
    }
  }, [container])

  if (!hover) return null

  const kindLabel = KIND_LABELS[hover.target.kind] || hover.target.kind
  const title = hover.card?.title || hover.target.label

  return (
    <div
      className="linear-reference-card"
      role="tooltip"
      aria-label={`${kindLabel} ${title}`}
      style={{ top: hover.rect.bottom + 6, left: Math.max(8, hover.rect.left) }}
      onMouseLeave={() => setHover(null)}
    >
      <div className="linear-reference-card-head">
        <span className="linear-reference-icon" data-kind={hover.target.kind} aria-hidden="true" />
        <span className="linear-reference-card-kind">{kindLabel}</span>
      </div>
      <div className="linear-reference-card-title">{title}</div>
      {hover.card?.subtitle ? (
        <div className="linear-reference-card-subtitle">{hover.card.subtitle}</div>
      ) : null}
      {hover.status === "loading" ? (
        <div className="linear-reference-card-status" role="status">
          Loading…
        </div>
      ) : null}
      {hover.status === "unresolved" ? (
        <div className="linear-reference-card-status">Not available in this workspace.</div>
      ) : null}
      {hover.card?.rows.length ? (
        <dl className="linear-reference-card-rows">
          {hover.card.rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

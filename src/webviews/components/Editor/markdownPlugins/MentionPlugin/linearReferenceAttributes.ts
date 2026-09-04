import type { LinearMentionKind } from "./LinearMention"

/**
 * Every Linear reference — entity mention or bare @handle — carries the same attributes so
 * one stylesheet and one hover card serve all of them.
 */
export const LINEAR_REFERENCE_ATTRIBUTE = "data-linear-reference"

export type LinearReferenceTarget = {
  kind: LinearMentionKind
  id: string
  label: string
}

export function referenceText(kind: unknown, label: unknown): string {
  const text = typeof label === "string" ? label : ""
  return kind === "user" ? `@${text}` : text
}

export function linearReferenceAttributes(target: {
  kind: unknown
  id: unknown
  label: unknown
}): Record<string, string> {
  return {
    class: "linear-reference",
    [LINEAR_REFERENCE_ATTRIBUTE]: typeof target.kind === "string" ? target.kind : "",
    "data-kind": typeof target.kind === "string" ? target.kind : "",
    "data-id": typeof target.id === "string" ? target.id : "",
    "data-label": typeof target.label === "string" ? target.label : "",
  }
}

export function readLinearReferenceTarget(element: Element): LinearReferenceTarget | null {
  const kind = element.getAttribute("data-kind")
  const id = element.getAttribute("data-id")

  return kind && id
    ? { kind: kind as LinearMentionKind, id, label: element.getAttribute("data-label") || id }
    : null
}

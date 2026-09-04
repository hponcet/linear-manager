export function escapeMarkdownLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/(\[|\])/g, "\\$1")
}

export function unescapeMarkdownPunctuation(value: string): string {
  return value.replace(/\\([\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e])/g, "$1")
}

/**
 * Linear runs its Markdown escaper over the raw payload of a `<linear-embed>` block, so an
 * asset signature — base64url, therefore routinely containing `_` — comes back as `\_` and the
 * JSON no longer parses. Drop the backslash from anything JSON does not define as an escape,
 * while leaving real JSON escapes (`\"`, `\\`, `\n`, `\uXXXX`, …) untouched.
 */
export function parseLinearEmbedJson(payload: string): unknown {
  const repaired = payload.replace(/\\(["\\/bfnrtu])|\\([\s\S])/g, (match, jsonEscape, escaped) =>
    jsonEscape === undefined ? escaped : match,
  )
  return JSON.parse(repaired)
}

export function formatMarkdownDestination(value: string): string {
  return `<${value.replace(/>/g, "%3E")}>`
}

export function formatMarkdownTitle(value: string | null | undefined): string {
  return value ? ` "${value.replace(/([\\"])/g, "\\$1")}"` : ""
}

export function isAllowedLinearLink(value: string): boolean {
  try {
    return ["http:", "https:", "mailto:"].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

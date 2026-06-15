export type TextLinkSegment =
  | { type: "text"; value: string }
  | { type: "link"; label: string; url: string }

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

export function parseTextWithLinks(text: string): TextLinkSegment[] {
  const segments: TextLinkSegment[] = []
  let lastIndex = 0

  MARKDOWN_LINK_PATTERN.lastIndex = 0
  for (const match of text.matchAll(MARKDOWN_LINK_PATTERN)) {
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, matchIndex) })
    }

    segments.push({ type: "link", label: match[1], url: match[2] })
    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ type: "text", value: text })
  }

  return segments
}

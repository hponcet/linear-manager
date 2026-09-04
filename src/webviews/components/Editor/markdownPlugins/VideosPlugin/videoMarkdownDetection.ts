import { unescapeMarkdownPunctuation } from "../../markdownEscaping"

const directVideoExtensions = new Set(["mp4", "webm", "ogv", "mov", "mkv", "m4v"])

export type VideoMarkdownSyntax = "embed" | "link"

export type ParsedVideoMarkdown = {
  raw: string
  src: string
  title: string
  destinationTitle: string | null
  syntax: VideoMarkdownSyntax
}

function isPlayableYouTubeUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase()
  if (hostname === "youtu.be") return url.pathname.split("/").filter(Boolean).length === 1
  if (hostname !== "youtube.com" && !hostname.endsWith(".youtube.com")) return false
  if (url.pathname === "/watch") return !!url.searchParams.get("v")
  return /^\/(?:embed|shorts)\/[^/]+\/?$/.test(url.pathname)
}

export function getLoomEmbedUrl(value: string): string | null {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (
    url.protocol !== "https:" ||
    (url.host !== "loom.com" && url.host !== "www.loom.com") ||
    url.username ||
    url.password
  ) {
    return null
  }

  const match = /^\/(?:share|embed)\/([a-z0-9_-]+)\/?$/i.exec(url.pathname)
  return match ? `https://www.loom.com/embed/${match[1]}` : null
}

function hasTrustedMediaHost(hostname: string): boolean {
  return (
    hostname === "linear.app" ||
    hostname.endsWith(".linear.app") ||
    hostname === "storage.googleapis.com"
  )
}

function getVideoUrlKind(value: string): "provider" | "direct" | null {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.protocol !== "https:") {
    return null
  }

  if (isPlayableYouTubeUrl(url)) {
    return "provider"
  }

  if (getLoomEmbedUrl(value)) {
    return "provider"
  }

  const extension = url.pathname.split(".").pop()?.toLowerCase()
  return extension !== undefined &&
    directVideoExtensions.has(extension) &&
    hasTrustedMediaHost(url.hostname.toLowerCase())
    ? "direct"
    : null
}

export function isSupportedVideoUrl(value: string): boolean {
  return getVideoUrlKind(value) !== null
}

/**
 * Linear labels a link it created itself after the last path segment, with the query
 * string when there is one. Its signature can be older than the one on the destination,
 * so only the segment is compared. A label the author wrote keeps its link rendering.
 */
function hasAutomaticLinkLabel(source: string, label: string): boolean {
  if (!label) {
    return false
  }

  try {
    const url = new URL(source)
    const segment = url.pathname.split("/").filter(Boolean).at(-1) ?? ""
    return segment !== "" && (label === segment || label.startsWith(`${segment}?`))
  } catch {
    return false
  }
}

/**
 * Uploaded Linear assets carry no extension in their URL, so the format lives in the label,
 * and an automatic label carries no format at all. The player checks the downloaded media
 * type for those, because only the asset itself can tell a video from another upload.
 */
function isExtensionlessLinearVideo(source: string, label: string): boolean {
  let url: URL

  try {
    url = new URL(source)
  } catch {
    return false
  }

  const filename = url.pathname.split("/").at(-1) ?? ""
  const labelExtension = label.split(".").at(-1)?.toLowerCase()

  if (
    url.protocol !== "https:" ||
    url.host !== "uploads.linear.app" ||
    url.username ||
    url.password ||
    filename.includes(".")
  ) {
    return false
  }

  return (
    (labelExtension !== undefined && directVideoExtensions.has(labelExtension)) ||
    hasAutomaticLinkLabel(source, label)
  )
}

const videoMarkdownPattern =
  /^(?<embed>!)?\[(?<label>(?:\\.|[^\]])*)\]\(\s*(?:<(?<angledUrl>[^>]+)>|(?<url>[^\s)]+))(?:\s+(?:"(?<doubleTitle>(?:\\.|[^"\\])*)"|'(?<singleTitle>(?:\\.|[^'\\])*)'))?\s*\)/

export function parseVideoMarkdown(source: string): ParsedVideoMarkdown | null {
  const match = videoMarkdownPattern.exec(source)
  const groups = match?.groups
  const src = groups?.angledUrl ?? groups?.url
  const title = unescapeMarkdownPunctuation(groups?.label || "")
  const uploaded = src !== undefined && isExtensionlessLinearVideo(src, title)
  const urlKind = src ? getVideoUrlKind(src) : null

  if (
    !match ||
    !groups ||
    !src ||
    (!urlKind && !uploaded) ||
    (!groups.embed && !uploaded && !hasAutomaticLinkLabel(src, title))
  ) {
    return null
  }

  const destinationTitle = groups.doubleTitle
    ? unescapeMarkdownPunctuation(groups.doubleTitle)
    : groups.singleTitle
      ? unescapeMarkdownPunctuation(groups.singleTitle)
      : null

  return {
    raw: match[0],
    src,
    title,
    destinationTitle,
    syntax: groups.embed ? "embed" : "link",
  }
}

export function findVideoMarkdown(source: string): number {
  const candidatePattern = /!?\[/g
  let match = candidatePattern.exec(source)

  while (match) {
    if (parseVideoMarkdown(source.slice(match.index))) {
      return match.index
    }

    match = candidatePattern.exec(source)
  }

  return -1
}

import { unescapeMarkdownPunctuation } from "../../markdownEscaping"

/**
 * Extensions that belong to a media plugin. Everything else uploaded to Linear is an
 * attachment, which Linear renders as a file card rather than a link.
 */
const mediaExtensions = new Set([
  // images
  "apng",
  "avif",
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
  // audio
  "aac",
  "flac",
  "m4a",
  "mp3",
  "oga",
  "ogg",
  "wav",
  // video
  "avi",
  "m4v",
  "mkv",
  "mov",
  "mp4",
  "ogv",
  "webm",
])

const extensionPattern = /^[a-z0-9]{1,8}$/

export type ParsedFileMarkdown = {
  raw: string
  href: string
  name: string
}

const fileLinkPattern =
  /^\[(?<name>(?:\\.|[^\]\\])*)\]\(\s*(?:<(?<angledUrl>[^>\r\n]+)>|(?<url>[^\s)]+))\s*\)/

/**
 * Linear serialises an uploaded attachment two ways: as a `<linear-embed node-type="file">`
 * block, and as a plain Markdown link whose label is the file name. Only the label carries the
 * type, because the asset URL has no extension.
 */
export function isLinearFileLink(href: string, name: string): boolean {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return false
  }

  if (url.protocol !== "https:" || url.host !== "uploads.linear.app") return false
  if (url.username || url.password) return false
  // A path that already names a file is handled by whichever plugin owns that extension.
  if ((url.pathname.split("/").at(-1) ?? "").includes(".")) return false

  const parts = name.split(".")
  if (parts.length < 2) return false
  const extension = parts.at(-1)?.toLowerCase() ?? ""

  return (
    extensionPattern.test(extension) && /[a-z]/.test(extension) && !mediaExtensions.has(extension)
  )
}

export function parseFileMarkdown(source: string): ParsedFileMarkdown | null {
  const match = fileLinkPattern.exec(source)
  const groups = match?.groups
  const href = groups?.angledUrl ?? groups?.url
  const name = unescapeMarkdownPunctuation(groups?.name ?? "")

  if (!match || !href || !isLinearFileLink(href, name)) return null

  return { raw: match[0], href, name }
}

export function findFileMarkdown(source: string): number {
  let index = source.indexOf("[")

  while (index !== -1) {
    // An image starts with "![", and that belongs to the image and media plugins.
    if (!(index > 0 && source[index - 1] === "!") && parseFileMarkdown(source.slice(index))) {
      return index
    }

    index = source.indexOf("[", index + 1)
  }

  return -1
}

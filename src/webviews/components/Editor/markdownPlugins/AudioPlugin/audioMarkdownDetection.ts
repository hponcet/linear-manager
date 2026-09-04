import { unescapeMarkdownPunctuation } from "../../markdownEscaping"

const audioExtensions = new Set(["mp3", "m4a", "wav", "oga", "flac", "aac"])

const audioDataMimeTypes = new Set([
  "audio/aac",
  "audio/flac",
  "audio/m4a",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/wave",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/x-wav",
])

export type ParsedAudioMarkdown = {
  raw: string
  src: string
  title: string
  destinationTitle: string | null
}

function isSupportedAudioDataUrl(value: string): boolean {
  const mimeType = /^data:([^;,]+)(?:;[^,]*)?,/i.exec(value)?.[1]?.toLowerCase()
  return mimeType !== undefined && audioDataMimeTypes.has(mimeType)
}

function isExtensionlessLinearAudio(value: string, title: string): boolean {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  const filename = url.pathname.split("/").at(-1) ?? ""
  const titleExtension = title.split(".").at(-1)?.toLowerCase()
  return (
    url.protocol === "https:" &&
    url.host === "uploads.linear.app" &&
    !url.username &&
    !url.password &&
    !filename.includes(".") &&
    titleExtension !== undefined &&
    audioExtensions.has(titleExtension)
  )
}

export function isSupportedAudioUrl(value: string): boolean {
  if (isSupportedAudioDataUrl(value)) {
    return true
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (url.protocol !== "https:") {
    return false
  }

  const hostname = url.hostname.toLowerCase()
  if (
    hostname !== "linear.app" &&
    !hostname.endsWith(".linear.app") &&
    hostname !== "storage.googleapis.com"
  ) {
    return false
  }

  const extension = url.pathname.split(".").pop()?.toLowerCase()
  return extension !== undefined && audioExtensions.has(extension)
}

const audioMarkdownPattern =
  /^!\[(?<title>(?:\\.|[^\]\\])*)\]\(\s*(?:<(?<angledUrl>[^>\r\n]+)>|(?<url>[^\s)]+))(?:\s+(?:"(?<doubleTitle>(?:\\.|[^"\\])*)"|'(?<singleTitle>(?:\\.|[^'\\])*)'))?\s*\)/

export function parseAudioMarkdown(source: string): ParsedAudioMarkdown | null {
  const match = audioMarkdownPattern.exec(source)
  const groups = match?.groups
  const src = groups?.angledUrl ?? groups?.url
  const title = unescapeMarkdownPunctuation(groups?.title ?? "")

  if (
    !match ||
    !groups ||
    !src ||
    (!isSupportedAudioUrl(src) && !isExtensionlessLinearAudio(src, title))
  ) {
    return null
  }

  return {
    raw: match[0],
    src,
    title,
    destinationTitle: groups.doubleTitle
      ? unescapeMarkdownPunctuation(groups.doubleTitle)
      : groups.singleTitle
        ? unescapeMarkdownPunctuation(groups.singleTitle)
        : null,
  }
}

export function findAudioMarkdown(source: string): number {
  let index = source.indexOf("![")

  while (index !== -1) {
    if (parseAudioMarkdown(source.slice(index))) {
      return index
    }

    index = source.indexOf("![", index + 2)
  }

  return -1
}

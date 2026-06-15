const VIDEO_MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
}

export function lookupVideoMimeType(src: string | null | undefined): string {
  if (!src) {
    return "video/mp4"
  }

  const path = src.split("?")[0]?.split("#")[0] ?? ""
  const extension = path.split(".").pop()?.toLowerCase()
  if (!extension) {
    return "video/mp4"
  }

  return VIDEO_MIME_TYPES[extension] ?? "video/mp4"
}

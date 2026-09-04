const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

export function parseAllowedExternalUrl(value: string): URL {
  const url = new URL(value)
  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) {
    throw new Error(`Unsupported external URL protocol: ${url.protocol}`)
  }
  return url
}

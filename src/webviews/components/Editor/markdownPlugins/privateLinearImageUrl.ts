export function getCanonicalPrivateLinearAssetUrl(source: string): string | null {
  try {
    const url = new URL(source)
    if (
      url.protocol !== "https:" ||
      url.host !== "uploads.linear.app" ||
      url.username ||
      url.password
    ) {
      return null
    }

    url.searchParams.delete("signature")
    return url.toString()
  } catch {
    return null
  }
}

export const getCanonicalPrivateLinearImageUrl = getCanonicalPrivateLinearAssetUrl

export function isPrivateLinearImageUrl(source: string): boolean {
  return getCanonicalPrivateLinearAssetUrl(source) !== null
}

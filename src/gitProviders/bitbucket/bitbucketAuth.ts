export function buildBitbucketApiTokenAuthHeader(email: string, token: string): string {
  const credentials = Buffer.from(`${email.trim()}:${token.trim()}`).toString("base64")
  return `Basic ${credentials}`
}

export function buildBitbucketOAuthAuthHeader(accessToken: string): string {
  return `Bearer ${accessToken.trim()}`
}

export function normalizeBitbucketApiToken(token: string): string {
  return token.trim().replace(/\s+/g, "")
}

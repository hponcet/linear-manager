import { GitProviderId, ParsedRemote } from "./types"

function parseSshUrl(url: string): { host: string; path: string } | null {
  const match = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/i)
  if (!match) return null
  return { host: match[1], path: match[2] }
}

function parseHttpsUrl(url: string): { host: string; path: string } | null {
  try {
    const parsed = new URL(url.replace(/\.git$/, ""))
    const path = parsed.pathname.replace(/^\//, "")
    if (!path) return null
    return { host: parsed.host, path }
  } catch {
    return null
  }
}

function detectProvider(host: string): GitProviderId | null {
  const normalized = host.toLowerCase()
  if (normalized === "github.com") return "github"
  if (normalized === "bitbucket.org") return "bitbucket"
  if (normalized === "gitlab.com" || normalized.includes("gitlab")) return "gitlab"
  return null
}

function splitOwnerRepo(path: string): { owner: string; repo: string } | null {
  const segments = path.split("/").filter(Boolean)
  if (segments.length < 2) return null
  const repo = segments.pop()!
  const owner = segments.join("/")
  return { owner, repo }
}

export function parseRemoteUrl(
  fetchUrl: string | undefined,
  fallbackProvider?: GitProviderId,
): ParsedRemote | null {
  if (!fetchUrl) return null

  const parsed = parseSshUrl(fetchUrl) ?? parseHttpsUrl(fetchUrl)
  if (!parsed) return null

  let provider = detectProvider(parsed.host)
  if (!provider && fallbackProvider === "gitlab") {
    provider = "gitlab"
  }
  if (!provider) return null

  const ownerRepo = splitOwnerRepo(parsed.path)
  if (!ownerRepo) return null

  const result: ParsedRemote = {
    provider,
    owner: ownerRepo.owner,
    repo: ownerRepo.repo,
  }

  if (provider === "gitlab" && parsed.host !== "gitlab.com") {
    result.host = `https://${parsed.host}`
  }

  return result
}

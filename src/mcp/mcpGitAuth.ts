import { buildBitbucketApiTokenAuthHeader } from "src/gitProviders/bitbucket/bitbucketAuth"
import {
  GitProviderSecretKeys,
  StoredBitbucketTokens,
  StoredGitLabTokens,
} from "src/gitProviders/secrets"
import { GitProviderId } from "src/gitProviders/types"
import { SettingsVscState, VscStateKeys } from "src/vscStates"
import { authentication, ExtensionContext } from "vscode"

export function settingsFromContext(context: ExtensionContext): SettingsVscState {
  return context.globalState.get<SettingsVscState>(VscStateKeys.branchesSettings) ?? {}
}

export async function resolveGitProviderAuth(
  context: ExtensionContext,
  providerId: GitProviderId,
  settings: SettingsVscState,
): Promise<{ accessToken?: string; authHeader?: string }> {
  switch (providerId) {
    case "github": {
      const session = await authentication.getSession("github", ["read:user", "repo"], {
        createIfNone: false,
      })
      return session ? { accessToken: session.accessToken } : {}
    }
    case "gitlab": {
      const instanceUrl = settings.gitlabInstanceUrl?.replace(/\/$/, "") || "https://gitlab.com"
      const raw = await context.secrets.get(GitProviderSecretKeys.gitlabTokens)
      if (!raw) {
        return {}
      }

      try {
        const stored = JSON.parse(raw) as StoredGitLabTokens
        const entry = stored[instanceUrl]
        if (!entry?.access_token) {
          return {}
        }

        if (entry.expires_at > Date.now() + 60_000) {
          return { accessToken: entry.access_token }
        }
      } catch {
        return {}
      }

      return {}
    }
    case "bitbucket": {
      const authMethod = settings.bitbucketAuthMethod ?? "apiToken"
      if (authMethod === "apiToken") {
        const token = await context.secrets.get(GitProviderSecretKeys.bitbucketApiToken)
        const email = settings.bitbucketAtlassianEmail?.trim()
        if (!token || !email) {
          return {}
        }

        return {
          authHeader: buildBitbucketApiTokenAuthHeader(email, token),
        }
      }

      const raw = await context.secrets.get(GitProviderSecretKeys.bitbucketTokens)
      if (!raw) {
        return {}
      }

      try {
        const stored = JSON.parse(raw) as StoredBitbucketTokens
        if (stored.expires_at > Date.now() + 60_000) {
          return { accessToken: stored.access_token }
        }
      } catch {
        return {}
      }

      return {}
    }
    default:
      return {}
  }
}

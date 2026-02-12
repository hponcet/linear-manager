import * as vscode from "vscode"

export const GITLAB_AUTHENTICATION_OAUTH_CLIENT_IDS = "gitlab.authentication.oauthClientIds"
export const BUNDLED_CLIENT_IDS = {
  ["https://gitlab.com"]: "36f2a70cddeb5a0889d4fd8295c241b7e9848e89cf9e599d0eed2d8e5350fbf5",
}

export interface AuthenticationConfiguration {
  oauthClientIds: Record<string, string | undefined>
}

function isRecordOfStringString(value: unknown): value is Record<string, string> {
  if (!value) return false
  if (typeof value !== "object") return false
  return Object.values(value).every((val) => typeof val === "string")
}

export function getAuthenticationConfiguration(): AuthenticationConfiguration {
  const oauthClientIds = vscode.workspace
    .getConfiguration()
    .get(GITLAB_AUTHENTICATION_OAUTH_CLIENT_IDS)
  // TODO: This is pretty strict, one invalid value blows up the whole parsing maybe we can still accept the valid parts
  if (isRecordOfStringString(oauthClientIds)) {
    return {
      oauthClientIds: {
        ...oauthClientIds,
        // Append bundled client IDs after user defined ones to avoid misconfiguration breaking clients.
        ...BUNDLED_CLIENT_IDS,
      },
    }
  }

  console.warn(
    `The 'gitlab.authentication.oauthClientIds' setting contains at least one invalid value, it can only contain JSON objects with GitLab instance URLs as keys and OAuth Client IDs as values. The object was ${JSON.stringify(oauthClientIds)}. Until the configuration is fixed, only the default gitlab.com OAuth client ID will be used.`,
  )

  return {
    oauthClientIds: BUNDLED_CLIENT_IDS,
  }
}

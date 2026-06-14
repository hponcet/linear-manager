import * as vscode from "vscode"

export const GITLAB_AUTHENTICATION_OAUTH_CLIENT_IDS = "gitlab.authentication.oauthClientIds"
export const BUNDLED_CLIENT_IDS: Record<string, string> = {
  "https://gitlab.com": "36f2a70cddeb5a0889d4fd8295c241b7e9848e89cf9e599d0eed2d8e5350fbf5",
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

  if (isRecordOfStringString(oauthClientIds)) {
    return {
      oauthClientIds: {
        ...BUNDLED_CLIENT_IDS,
        ...oauthClientIds,
      },
    }
  }

  console.warn(
    `The 'gitlab.authentication.oauthClientIds' setting contains invalid values. Using bundled gitlab.com OAuth client ID only.`,
  )

  return {
    oauthClientIds: BUNDLED_CLIENT_IDS,
  }
}

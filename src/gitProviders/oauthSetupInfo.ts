import { env } from "vscode"

import { BitbucketAuthMethod, GitProviderId, GitProviderOAuthSetup } from "./types"

export function getGitlabOAuthRedirectUri(): string {
  return `${env.uriScheme}://linear-manager/gitlab/oauth`
}

export function getBitbucketOAuthRedirectUri(): string {
  return `${env.uriScheme}://linear-manager/bitbucket/oauth`
}

export function getBitbucketWorkspaceOAuthConsumersUrl(workspace: string): string {
  return `https://bitbucket.org/${encodeURIComponent(workspace)}/workspace/settings/oauth-consumers/new`
}

export type BitbucketSetupOptions = {
  authMethod?: BitbucketAuthMethod
  workspace?: string
}

function getBitbucketOAuthSetupInfo(options?: BitbucketSetupOptions): GitProviderOAuthSetup {
  const authMethod = options?.authMethod ?? "apiToken"
  const workspace = options?.workspace?.trim()

  if (authMethod === "apiToken") {
    return {
      signInLabel: "Connect with API token",
      instructions:
        "Recommended for personal use. API tokens authenticate with your Atlassian account email plus the token (Basic auth), not as a Bearer token.",
      permissions: "read:pullrequest:bitbucket, read:user:bitbucket",
      setupSteps: [
        "Click your avatar (top right) on [bitbucket.org](https://bitbucket.org) → [Account settings](https://bitbucket.org/account/settings/).",
        "Note your Atlassian account email under Email aliases ([Personal settings](https://bitbucket.org/account/settings/)).",
        "Open [Atlassian Security → API tokens](https://id.atlassian.com/manage-profile/security/api-tokens) → Create API token with scopes.",
        "Select Bitbucket as the app.",
        "Enable read:pullrequest:bitbucket and read:user:bitbucket, then create the token.",
        "Enter your Atlassian email and paste the token below, then click Connect.",
      ],
      docsUrl: "https://support.atlassian.com/bitbucket-cloud/docs/create-an-api-token/",
    }
  }

  const workspaceSetupUrl = workspace
    ? getBitbucketWorkspaceOAuthConsumersUrl(workspace)
    : undefined

  return {
    signInLabel: "Sign in with Bitbucket",
    redirectUri: getBitbucketOAuthRedirectUri(),
    instructions:
      "For teams or when a workspace admin creates the consumer. OAuth consumers live in workspace settings — not personal account settings. You need workspace admin access to create one.",
    permissions: "Account: Read · Pull requests: Read",
    workspaceSetupUrl,
    setupSteps: [
      workspace
        ? `Open your [OAuth consumers page](${workspaceSetupUrl}), or go to avatar → your workspace → Settings → Workspace settings.`
        : "On [bitbucket.org](https://bitbucket.org): avatar → select the workspace that owns your repo → Settings → Workspace settings.",
      "Under Apps and features, open OAuth consumers → Add consumer.",
      "Name it (e.g. Linear Manager), paste the Callback URL below exactly, and enable This is a private consumer.",
      "Permissions: Account → Read; Pull requests → Read. Save.",
      "Expand the new consumer and copy its Key and Secret into the fields below.",
      "Click Sign in — Bitbucket opens in your browser, then you return to VS Code automatically.",
    ],
    docsUrl:
      "https://support.atlassian.com/bitbucket-cloud/docs/integrate-another-application-through-oauth/",
  }
}

export function getOAuthSetupInfo(
  provider: GitProviderId,
  bitbucketOptions?: BitbucketSetupOptions,
): GitProviderOAuthSetup {
  switch (provider) {
    case "github": {
      const editorName = env.appName || "VS Code"
      const isCursor = editorName.toLowerCase().includes("cursor")
      return {
        signInLabel: "Sign in with GitHub",
        instructions: isCursor
          ? `${editorName} uses VS Code's built-in GitHub sign-in. GitHub may show "Authorize Visual Studio Code" — that is expected and grants access to your editor, not a separate app.`
          : `Uses ${editorName}'s built-in GitHub sign-in (same integration as GitHub Pull Requests and Settings Sync).`,
        setupSteps: isCursor
          ? [
              "Click Sign in with GitHub.",
              "Complete SSO in the account picker or browser.",
              'On GitHub, approve "Visual Studio Code" if prompted — Cursor reuses that OAuth integration.',
            ]
          : ["Click Sign in with GitHub.", "Complete SSO in the account picker or browser."],
        permissions: "read:user, repo",
      }
    }
    case "gitlab":
      return {
        signInLabel: "Sign in with GitLab",
        redirectUri: getGitlabOAuthRedirectUri(),
        instructions:
          "Sign in opens GitLab in your browser. Create an OAuth application on [gitlab.com](https://gitlab.com/-/user_settings/applications) (User settings → Applications, or ask your admin for self-managed) with redirect URI shown below, then add its Application ID to gitlab.authentication.oauthClientIds. gitlab.com falls back to a bundled client ID when none is configured.",
        setupSteps: [
          "Open [User settings → Applications](https://gitlab.com/-/user_settings/applications) on gitlab.com (or the equivalent page on your self-managed instance).",
          "Create an application and set the Callback URL below as the redirect URI.",
          "Add the Application ID to gitlab.authentication.oauthClientIds in VS Code settings.",
          "Click Sign in with GitLab.",
        ],
        permissions: "read_api",
      }
    case "bitbucket":
      return getBitbucketOAuthSetupInfo(bitbucketOptions)
  }
}

export function formatGitLabMissingClientIdMessage(instanceUrl: string): string {
  return (
    `No OAuth client ID configured for ${instanceUrl}. ` +
    `Register an OAuth app with redirect URI ${getGitlabOAuthRedirectUri()} ` +
    `and add the client ID to gitlab.authentication.oauthClientIds in VS Code settings.`
  )
}

export function formatBitbucketMissingClientIdMessage(): string {
  return (
    "Bitbucket OAuth consumer Key is not configured. " +
    "Create an OAuth consumer in Workspace settings → OAuth consumers " +
    `(callback URL ${getBitbucketOAuthRedirectUri()}) ` +
    "and enter the Key in Settings."
  )
}

export function formatBitbucketMissingApiTokenMessage(): string {
  return (
    "Bitbucket API token is not configured. " +
    "Create one in Account settings → Security → API tokens with read:pullrequest:bitbucket and read:user:bitbucket, " +
    "enter your Atlassian account email, then connect."
  )
}

export function formatBitbucketMissingEmailMessage(): string {
  return (
    "Atlassian account email is required for Bitbucket API token authentication. " +
    "Find it under bitbucket.org → Personal settings → Email aliases."
  )
}

export type { GitProviderOAuthSetup }

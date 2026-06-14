import { useEffect, useState } from "react"
import { Input, SelectPicker } from "rsuite"
import {
  BitbucketAuthMethod,
  GitProviderId,
  GitProviderOAuthSetup,
  GitProviderStatus,
} from "src/gitProviders/types"
import { SettingsVscState } from "src/vscStates"
import { Button } from "src/webviews/components/Button/Button"

import { GitSettingsField } from "./GitSettingsField"

const PROVIDER_OPTIONS: { label: string; value: GitProviderId }[] = [
  { label: "GitHub", value: "github" },
  { label: "GitLab", value: "gitlab" },
  { label: "Bitbucket Cloud", value: "bitbucket" },
]

const BITBUCKET_AUTH_OPTIONS: { label: string; value: BitbucketAuthMethod }[] = [
  { label: "HTTP access token (recommended)", value: "apiToken" },
  { label: "OAuth consumer (workspace admin)", value: "oauth" },
]

const PROVIDER_LABELS: Record<GitProviderId, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket Cloud",
}

type GitProviderConnectionSectionProps = {
  branchesSettings?: SettingsVscState
  updateSettings: (value: Partial<SettingsVscState>) => void
  providerStatus: GitProviderStatus | null
  oauthSetup: GitProviderOAuthSetup | null
  connecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  onProviderChange: (provider: GitProviderId | undefined) => void
  onBitbucketAuthMethodChange: (method: BitbucketAuthMethod) => void
  bitbucketApiToken: string
  onBitbucketApiTokenChange: (value: string) => void
  bitbucketOAuthSecret: string
  onBitbucketOAuthSecretChange: (value: string) => void
}

export function GitProviderConnectionSection(props: GitProviderConnectionSectionProps) {
  const {
    branchesSettings,
    updateSettings,
    providerStatus,
    oauthSetup,
    connecting,
    onConnect,
    onDisconnect,
    onProviderChange,
    onBitbucketAuthMethodChange,
    bitbucketApiToken,
    onBitbucketApiTokenChange,
    bitbucketOAuthSecret,
    onBitbucketOAuthSecretChange,
  } = props

  const selectedProvider = branchesSettings?.gitProvider
  const bitbucketAuthMethod = branchesSettings?.bitbucketAuthMethod ?? "apiToken"
  const connected = Boolean(providerStatus?.connected)
  const remoteMismatch = Boolean(
    providerStatus?.remote && providerStatus.remoteMatchesProvider === false,
  )

  const [setupExpanded, setSetupExpanded] = useState(!connected)
  const [detailsExpanded, setDetailsExpanded] = useState(!connected)

  useEffect(() => {
    if (!connected) {
      setSetupExpanded(true)
      setDetailsExpanded(true)
    } else {
      setDetailsExpanded(false)
      setSetupExpanded(false)
    }
  }, [connected, selectedProvider, bitbucketAuthMethod])

  const showDetails = !connected || detailsExpanded

  const signInLabel = oauthSetup?.signInLabel ?? "Sign in"
  const permissions = oauthSetup?.permissions ?? oauthSetup?.scopes
  const hasSetupContent = Boolean(
    oauthSetup?.instructions ||
    oauthSetup?.setupSteps?.length ||
    oauthSetup?.redirectUri ||
    oauthSetup?.docsUrl,
  )

  const statusText = connected
    ? `Connected${providerStatus?.accountLabel ? ` as ${providerStatus.accountLabel}` : ""}`
    : selectedProvider
      ? `Not connected to ${PROVIDER_LABELS[selectedProvider]}`
      : "No provider selected"

  return (
    <div
      className={`git-provider-connection${connected && !detailsExpanded ? " git-provider-connection--collapsed" : ""}`}
    >
      <div className="git-provider-connection__status">
        <span className="git-provider-connection__status-dot" data-connected={connected} />
        <span className="git-provider-connection__status-label">
          {statusText}
          {selectedProvider && !connected && (
            <span className="git-provider-connection__status-meta">
              {" "}
              — complete the fields below, then connect
            </span>
          )}
        </span>
        {connected && (
          <button
            type="button"
            className="git-provider-connection__expand-btn"
            onClick={() => setDetailsExpanded((open) => !open)}
            aria-expanded={detailsExpanded}
            aria-label={detailsExpanded ? "Collapse provider settings" : "Expand provider settings"}
          >
            {detailsExpanded ? "Collapse" : "Expand"}
            <span aria-hidden className="git-provider-connection__expand-icon">
              {detailsExpanded ? "▾" : "▸"}
            </span>
          </button>
        )}
      </div>

      {showDetails && (
        <div className="git-provider-connection__config">
          <GitSettingsField label="Git provider">
            <SelectPicker
              data={PROVIDER_OPTIONS}
              value={selectedProvider ?? null}
              onChange={(value) => {
                const provider = (value as GitProviderId | null) ?? undefined
                updateSettings({ gitProvider: provider })
                onProviderChange(provider)
              }}
              placeholder="Select a git provider"
              block
              cleanable
            />
          </GitSettingsField>

          {selectedProvider === "gitlab" && (
            <div className="git-settings-credentials">
              <p className="git-settings-credentials__title">Configuration</p>
              <GitSettingsField
                label="GitLab instance URL"
                hint="Used to match your remote and OAuth application."
              >
                <Input
                  value={branchesSettings?.gitlabInstanceUrl ?? "https://gitlab.com"}
                  onChange={(value) => updateSettings({ gitlabInstanceUrl: value || undefined })}
                  placeholder="https://gitlab.com"
                />
              </GitSettingsField>
            </div>
          )}

          {selectedProvider === "bitbucket" && (
            <>
              <GitSettingsField
                label="Authentication method"
                hint="Use an HTTP access token for personal accounts. OAuth consumers require workspace admin access."
              >
                <SelectPicker
                  data={BITBUCKET_AUTH_OPTIONS}
                  value={bitbucketAuthMethod}
                  onChange={(value) => {
                    const method = (value as BitbucketAuthMethod | null) ?? "apiToken"
                    updateSettings({ bitbucketAuthMethod: method })
                    onBitbucketAuthMethodChange(method)
                  }}
                  block
                  cleanable={false}
                />
              </GitSettingsField>

              {bitbucketAuthMethod === "apiToken" && (
                <div className="git-settings-credentials">
                  <p className="git-settings-credentials__title">Credentials</p>
                  <GitSettingsField
                    label="Atlassian account email"
                    hint="From Personal settings → Email aliases. Required with the API token (Basic auth)."
                  >
                    <Input
                      value={branchesSettings?.bitbucketAtlassianEmail ?? ""}
                      onChange={(value) =>
                        updateSettings({ bitbucketAtlassianEmail: value.trim() || undefined })
                      }
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </GitSettingsField>
                  <GitSettingsField
                    label="API token"
                    hint="Create in Atlassian account settings → Security → API tokens."
                    mono
                  >
                    <Input
                      type="password"
                      value={bitbucketApiToken}
                      onChange={onBitbucketApiTokenChange}
                      placeholder="Paste your Bitbucket HTTP access token"
                      autoComplete="off"
                    />
                  </GitSettingsField>
                </div>
              )}

              {bitbucketAuthMethod === "oauth" && (
                <div className="git-settings-credentials">
                  <p className="git-settings-credentials__title">OAuth consumer</p>
                  <GitSettingsField
                    label="Key"
                    hint="From Workspace settings → OAuth consumers, after creating the consumer."
                    mono
                  >
                    <Input
                      value={branchesSettings?.bitbucketOAuthClientId ?? ""}
                      onChange={(value) =>
                        updateSettings({ bitbucketOAuthClientId: value || undefined })
                      }
                      placeholder="Consumer Key"
                    />
                  </GitSettingsField>
                  <GitSettingsField
                    label="Secret"
                    hint="Shown once when the consumer is created. Stored securely in VS Code."
                    mono
                  >
                    <Input
                      type="password"
                      value={bitbucketOAuthSecret}
                      onChange={onBitbucketOAuthSecretChange}
                      placeholder="Consumer Secret"
                      autoComplete="off"
                    />
                  </GitSettingsField>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showDetails && selectedProvider && hasSetupContent && (
        <>
          <button
            type="button"
            className="git-provider-connection__setup-toggle"
            onClick={() => setSetupExpanded((open) => !open)}
            aria-expanded={setupExpanded}
          >
            <span>{setupExpanded ? "Hide setup instructions" : "Show setup instructions"}</span>
            <span aria-hidden>{setupExpanded ? "▾" : "▸"}</span>
          </button>

          {setupExpanded && (
            <div className="git-provider-connection__setup">
              {oauthSetup?.instructions && (
                <p className="git-provider-connection__setup-intro">{oauthSetup.instructions}</p>
              )}

              {oauthSetup?.setupSteps && oauthSetup.setupSteps.length > 0 && (
                <ol className="git-provider-connection__setup-steps">
                  {oauthSetup.setupSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}

              {(oauthSetup?.workspaceSetupUrl || oauthSetup?.docsUrl) && (
                <div className="git-provider-connection__setup-links">
                  {oauthSetup.workspaceSetupUrl && (
                    <a href={oauthSetup.workspaceSetupUrl} target="_blank" rel="noreferrer">
                      Open OAuth consumer setup for this workspace
                    </a>
                  )}
                  {oauthSetup.docsUrl && (
                    <a href={oauthSetup.docsUrl} target="_blank" rel="noreferrer">
                      Atlassian documentation
                    </a>
                  )}
                </div>
              )}

              {oauthSetup?.redirectUri && (
                <div className="git-provider-connection__callback">
                  <span className="git-provider-connection__callback-label">Callback URL</span>
                  <code className="git-provider-connection__callback-value">
                    {oauthSetup.redirectUri}
                  </code>
                  <Button
                    onClick={() => void navigator.clipboard.writeText(oauthSetup.redirectUri!)}
                    style={{ flexShrink: 0 }}
                  >
                    Copy
                  </Button>
                </div>
              )}

              {permissions && (
                <div className="git-provider-connection__permissions">
                  Required permissions: {permissions}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedProvider && (
        <div className="git-provider-connection__footer">
          {remoteMismatch && (
            <div className="git-provider-connection__warning">
              The selected provider does not match this repository&apos;s remote.
            </div>
          )}
          {connected ? (
            <Button onClick={onDisconnect} disabled={connecting}>
              Sign out
            </Button>
          ) : (
            <Button onClick={onConnect} disabled={connecting} loading={connecting}>
              {signInLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

import { useState } from "react"
import { useGitProvider } from "src/webviews/hooks/useGitProvider"
import { useSettings } from "src/webviews/hooks/useSettings"
import { GitProviderConnectionSection } from "src/webviews/views/StartWorkWebview/GitProviderConnectionSection"
import { GitSettingsSection } from "src/webviews/views/StartWorkWebview/GitSettingsSection"

export function SettingsGitTab() {
  const { updateSettings, branchesSettings } = useSettings()
  const selectedProvider = branchesSettings?.gitProvider
  const bitbucketAuthMethod = branchesSettings?.bitbucketAuthMethod ?? "apiToken"

  const [bitbucketApiToken, setBitbucketApiToken] = useState("")
  const [bitbucketOAuthSecret, setBitbucketOAuthSecret] = useState("")

  const {
    status: providerStatus,
    oauthSetup,
    connecting,
    connect,
    disconnect,
    refreshStatus,
    refreshOAuthSetup,
  } = useGitProvider(selectedProvider)

  const handleBitbucketConnect = () => {
    void connect({
      bitbucketApiToken:
        bitbucketAuthMethod === "apiToken" ? bitbucketApiToken || undefined : undefined,
      bitbucketOAuthClientSecret:
        bitbucketAuthMethod === "oauth" ? bitbucketOAuthSecret || undefined : undefined,
    }).then((nextStatus) => {
      if (nextStatus?.connected) {
        setBitbucketApiToken("")
        setBitbucketOAuthSecret("")
      }
    })
  }

  return (
    <GitSettingsSection
      title="Provider connection"
      description="Connect to your git host to look up and open pull requests from issues."
    >
      <GitProviderConnectionSection
        branchesSettings={branchesSettings}
        updateSettings={updateSettings}
        providerStatus={providerStatus}
        oauthSetup={oauthSetup}
        connecting={connecting}
        onConnect={selectedProvider === "bitbucket" ? handleBitbucketConnect : () => void connect()}
        onDisconnect={() => void disconnect()}
        onProviderChange={(provider) => {
          void refreshStatus()
          if (provider) {
            void refreshOAuthSetup(provider)
          }
        }}
        onBitbucketAuthMethodChange={(method) => {
          void refreshOAuthSetup("bitbucket", method)
        }}
        bitbucketApiToken={bitbucketApiToken}
        onBitbucketApiTokenChange={setBitbucketApiToken}
        bitbucketOAuthSecret={bitbucketOAuthSecret}
        onBitbucketOAuthSecretChange={setBitbucketOAuthSecret}
      />
    </GitSettingsSection>
  )
}

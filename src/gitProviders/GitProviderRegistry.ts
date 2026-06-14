import { ExtensionContext } from "vscode"

import { BitbucketProvider } from "./bitbucket/BitbucketProvider"
import { GitHubProvider } from "./github/GitHubProvider"
import { GitLabProvider } from "./gitlab/GitLabProvider"
import { GitProvider } from "./GitProvider"
import { GitProviderId } from "./types"

export class GitProviderRegistry {
  readonly #providers: Map<GitProviderId, GitProvider>

  constructor(context: ExtensionContext) {
    this.#providers = new Map<GitProviderId, GitProvider>([
      ["github", new GitHubProvider(context)],
      ["gitlab", new GitLabProvider(context)],
      ["bitbucket", new BitbucketProvider(context)],
    ])
  }

  getProvider(id: GitProviderId): GitProvider {
    const provider = this.#providers.get(id)
    if (!provider) {
      throw new Error(`Unknown git provider: ${id}`)
    }
    return provider
  }

  getAllProviders(): GitProvider[] {
    return Array.from(this.#providers.values())
  }
}

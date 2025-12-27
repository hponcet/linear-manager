import { extensions, window } from "vscode";
import { GitExtension } from "../types/GitAPI";
import { CommandContext, setCommandContext } from "../commandsContext";

export class GitClient {
  private gitClient = extensions
    .getExtension<GitExtension>("vscode.git")
    ?.exports.getAPI(1);

  constructor() {
    if (!this.gitClient) {
      window.showErrorMessage(
        "Git extension not found. Please make sure Git is installed and the Git extension is enabled."
      );
      setCommandContext(CommandContext.gitExtensionLoaded, false);
    } else {
      setCommandContext(CommandContext.gitExtensionLoaded, true);
    }
  }

  getCurrentBranch(): string | null {
    if (!this.gitClient) {
      return null;
    }

    return this.gitClient?.repositories[0]?.state.HEAD?.name || null;
  }

  fetchRemotes(): string[] {
    if (!this.gitClient) {
      return [];
    }

    const remotes = this.gitClient?.repositories[0]?.state.remotes || [];
    return remotes.map((remote) => remote.name);
  }

  fetchCurrentRemoteUrl(): string | null {
    if (!this.gitClient) {
      return null;
    }

    const remotes = this.gitClient?.repositories[0]?.state.remotes || [];
    const originRemote = remotes.find((remote) => remote.name === "origin");
    return originRemote ? originRemote.fetchUrl || null : null;
  }
}

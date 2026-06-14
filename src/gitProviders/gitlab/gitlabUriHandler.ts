import { EventEmitter, Uri, UriHandler } from "vscode"

class GitLabUriHandler extends EventEmitter<Uri> implements UriHandler {
  async handleUri(uri: Uri): Promise<void> {
    this.fire(uri)
  }
}

export const gitlabUriHandler = new GitLabUriHandler()

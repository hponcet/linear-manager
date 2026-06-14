import { EventEmitter, Uri, UriHandler } from "vscode"

class BitbucketUriHandler extends EventEmitter<Uri> implements UriHandler {
  async handleUri(uri: Uri): Promise<void> {
    this.fire(uri)
  }
}

export const bitbucketUriHandler = new BitbucketUriHandler()

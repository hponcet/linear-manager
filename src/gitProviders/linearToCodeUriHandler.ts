import { Uri, UriHandler } from "vscode"

import { bitbucketUriHandler } from "./bitbucket/bitbucketUriHandler"
import { gitlabUriHandler } from "./gitlab/gitlabUriHandler"

class LinearToCodeUriHandler implements UriHandler {
  async handleUri(uri: Uri): Promise<void> {
    if (uri.path.startsWith("/gitlab/")) {
      await gitlabUriHandler.handleUri(uri)
      return
    }

    if (uri.path.startsWith("/bitbucket/")) {
      await bitbucketUriHandler.handleUri(uri)
    }
  }
}

export const linearToCodeUriHandler = new LinearToCodeUriHandler()

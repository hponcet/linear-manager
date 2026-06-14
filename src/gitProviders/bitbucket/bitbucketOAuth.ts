import assert from "assert"
import crypto from "crypto"

import { env, ProgressLocation, Uri, window } from "vscode"

import { bitbucketUriHandler } from "./bitbucketUriHandler"

import { promiseFromEvent } from "../../utils/promiseFromEvent"
import { getBitbucketOAuthRedirectUri } from "../oauthSetupInfo"

export { getBitbucketOAuthRedirectUri }

export interface BitbucketTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

const generateState = (): string => crypto.randomBytes(32).toString("hex")

export class BitbucketOAuth {
  #requestsInProgress = new Set<string>()

  async authenticate(clientId: string, clientSecret: string): Promise<BitbucketTokenResponse> {
    const state = generateState()
    this.#requestsInProgress.add(state)

    const authorizeUrl = new URL("https://bitbucket.org/site/oauth2/authorize")
    authorizeUrl.searchParams.set("client_id", clientId)
    authorizeUrl.searchParams.set("response_type", "code")
    authorizeUrl.searchParams.set("state", state)
    authorizeUrl.searchParams.set("redirect_uri", getBitbucketOAuthRedirectUri())

    const { promise: redirectPromise, cancel } = promiseFromEvent<Uri, BitbucketTokenResponse>(
      bitbucketUriHandler.event,
      (uri, resolve, reject) => {
        if (uri.path !== "/bitbucket/oauth") return
        const params = new URLSearchParams(uri.query)
        const urlState = params.get("state")
        if (!urlState || urlState !== state) return
        if (!this.#requestsInProgress.has(state)) return

        const code = params.get("code")
        if (!code) {
          reject(new Error("Bitbucket OAuth redirect did not contain a code."))
          return
        }

        void this.exchangeCode(code, clientId, clientSecret).then(resolve).catch(reject)
      },
    )

    await env.openExternal(Uri.parse(authorizeUrl.toString()))

    try {
      return await window.withProgress(
        {
          title: "Waiting for Bitbucket OAuth redirect.",
          location: ProgressLocation.Notification,
        },
        () =>
          Promise.race([
            redirectPromise,
            new Promise<BitbucketTokenResponse>((_, reject) => {
              setTimeout(
                () => reject(new Error("Bitbucket OAuth timed out after 60s. Try again.")),
                60000,
              )
            }),
          ]),
      )
    } finally {
      this.#requestsInProgress.delete(state)
      cancel.fire(undefined)
    }
  }

  async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
  ): Promise<BitbucketTokenResponse> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getBitbucketOAuthRedirectUri(),
    })

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const response = await fetch("https://bitbucket.org/site/oauth2/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(30000),
    })

    const result = await response.json()
    assert(result.access_token, "Bitbucket token response is missing access_token.")
    return result
  }

  async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<BitbucketTokenResponse> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const response = await fetch("https://bitbucket.org/site/oauth2/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(30000),
    })

    const result = await response.json()
    assert(result.access_token, "Bitbucket token response is missing access_token.")
    return result
  }
}

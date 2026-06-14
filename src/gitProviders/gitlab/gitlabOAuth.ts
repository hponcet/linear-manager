import assert from "assert"
import crypto from "crypto"

import { v4 as uuidv4 } from "uuid"
import { env, ProgressLocation, Uri, window } from "vscode"

import { getAuthenticationConfiguration } from "./extensionConfig"
import { gitlabUriHandler } from "./gitlabUriHandler"

import { promiseFromEvent, PromiseAdapter } from "../../utils/promiseFromEvent"
import { getGitlabOAuthRedirectUri } from "../oauthSetupInfo"

export { getGitlabOAuthRedirectUri }

export interface ExchangeTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  created_at: number
}

interface OAuthUrlParams {
  instanceUrl: string
  clientId: string
  redirectUri: string
  responseType?: string
  state: string
  scopes: string
  codeChallenge: string
  codeChallengeMethod?: string
}

interface AuthorizationCodeTokenExchangeParams {
  instanceUrl: string
  code: string
  codeVerifier: string
  grantType: "authorization_code"
}

interface RefreshTokenExchangeParams {
  instanceUrl: string
  grantType: "refresh_token"
  refreshToken: string
}

type TokenExchangeUrlParams = AuthorizationCodeTokenExchangeParams | RefreshTokenExchangeParams

const generateSecret = (): string => {
  let secret = ""
  const length = Math.floor(Math.random() * 11) + 50
  while (secret.length < length) {
    secret += uuidv4().replace(/-/g, "")
  }
  return secret.substring(0, length)
}

export class GitlabOAuth {
  #requestsInProgress: Record<string, string> = {}

  supportsGitLabInstance(url: string): boolean {
    const clientId = getAuthenticationConfiguration().oauthClientIds[url]
    return clientId !== undefined && clientId !== null && clientId !== ""
  }

  async authenticate(url: string): Promise<ExchangeTokenResponse | undefined> {
    if (this.supportsGitLabInstance(url)) {
      return this.#createAccount(url, ["read_api"])
    }

    return undefined
  }

  async #createAccount(
    instanceUrl: string,
    scopes: readonly string[],
  ): Promise<ExchangeTokenResponse> {
    const { url, state, codeVerifier, clientId } = this.createLoginUrl(instanceUrl, scopes)
    this.#requestsInProgress[state] = codeVerifier
    const { promise: receivedRedirectUrl, cancel: cancelWaitingForRedirectUrl } = promiseFromEvent<
      Uri,
      ExchangeTokenResponse
    >(gitlabUriHandler.event, this.#exchangeCodeForToken(instanceUrl, state, scopes, clientId))
    await env.openExternal(Uri.parse(url))
    const account = await window.withProgress(
      {
        title: `Waiting for OAuth redirect from ${instanceUrl}.`,
        location: ProgressLocation.Notification,
      },
      () =>
        Promise.race([
          receivedRedirectUrl,
          new Promise<ExchangeTokenResponse>((_, reject) => {
            setTimeout(
              () => reject(new Error("Cancelling the GitLab OAuth login after 60s. Try again.")),
              60000,
            )
          }),
        ]).finally(() => {
          delete this.#requestsInProgress[state]
          cancelWaitingForRedirectUrl.fire(undefined)
        }),
    )

    return account
  }

  async exchangeToken(
    params: TokenExchangeUrlParams,
    clientId: string,
  ): Promise<ExchangeTokenResponse> {
    const commonParams = [
      `client_id=${clientId}`,
      `redirect_uri=${encodeURIComponent(getGitlabOAuthRedirectUri())}`,
      `grant_type=${params.grantType}`,
    ]
    const grantTypeParams =
      params.grantType === "authorization_code"
        ? [`code=${params.code}`, `code_verifier=${params.codeVerifier}`]
        : [`refresh_token=${params.refreshToken}`]

    const response = await fetch(`${params.instanceUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: [...commonParams, ...grantTypeParams].join("&"),
      signal: AbortSignal.timeout(30000),
    })
    const result = await response.json()
    assert(result.access_token, "Token response is missing access token.")
    assert(result.refresh_token, "Token response is missing refresh token.")
    return result
  }

  createOAuthAccountFromCode = async (
    params: AuthorizationCodeTokenExchangeParams & { scopes: readonly string[] },
    clientId: string,
  ): Promise<ExchangeTokenResponse> => {
    const { code, codeVerifier } = params
    return this.exchangeToken(
      {
        instanceUrl: params.instanceUrl,
        grantType: "authorization_code",
        code,
        codeVerifier,
      },
      clientId,
    )
  }

  generateCodeChallengeFromVerifier = (v: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(v)
    return crypto
      .createHash("sha256")
      .update(data)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  createAuthUrl = ({
    instanceUrl,
    clientId,
    redirectUri,
    responseType = "code",
    state,
    scopes,
    codeChallenge,
    codeChallengeMethod = "S256",
  }: OAuthUrlParams) =>
    `${instanceUrl}/oauth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      state,
      scope: scopes,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
    })}`

  createLoginUrl = (
    instanceUrl: string,
    scopesParam?: readonly string[],
  ): { url: string; state: string; codeVerifier: string; clientId: string } => {
    const state = generateSecret()
    const redirectUri = getGitlabOAuthRedirectUri()
    const codeVerifier = generateSecret()
    const codeChallenge = this.generateCodeChallengeFromVerifier(codeVerifier)
    const scopes = (scopesParam ?? ["read_api"]).join(" ")
    const clientId = getAuthenticationConfiguration().oauthClientIds[instanceUrl] || ""
    return {
      url: this.createAuthUrl({ instanceUrl, clientId, redirectUri, state, scopes, codeChallenge }),
      state,
      codeVerifier,
      clientId,
    }
  }

  #exchangeCodeForToken: (
    instanceUrl: string,
    state: string,
    scopes: readonly string[],
    clientId: string,
  ) => PromiseAdapter<Uri, ExchangeTokenResponse> =
    (instanceUrl, state, scopes, clientId) =>
    async (
      uri: Uri,
      resolve: (value: ExchangeTokenResponse) => void,
      reject: (reason?: unknown) => void,
    ) => {
      if (uri.path !== "/gitlab/oauth") return
      const searchParams = new URLSearchParams(uri.query)
      const urlState = searchParams.get("state")
      if (!urlState) {
        reject(new Error(`Authentication URL ${uri} didn't contain 'state' query param.`))
        return
      }
      if (state !== urlState) return
      const codeVerifier = this.#requestsInProgress[state]
      assert(codeVerifier, "Code verifier is missing.")
      const code = searchParams.get("code")
      if (!code) {
        const error = searchParams.get("error")
        const description = searchParams.get("error_description")
        reject(
          new Error(
            error
              ? `GitLab OAuth failed: ${error}${description ? ` — ${description}` : ""}`
              : `Authentication URL ${uri} didn't contain 'code' query param.`,
          ),
        )
        return
      }
      try {
        const account = await this.createOAuthAccountFromCode(
          {
            instanceUrl,
            grantType: "authorization_code",
            code,
            codeVerifier,
            scopes,
          },
          clientId,
        )
        resolve(account)
      } catch (e) {
        console.error("OAuth flow: Creating account from code failed: ", e)
        reject(e)
      }
    }
}

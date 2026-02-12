import assert from "assert"
import crypto from "crypto"

import { v4 as uuidv4 } from "uuid"
import vscode from "vscode"

import { getAuthenticationConfiguration } from "./extensionConfig"

import { promiseFromEvent, PromiseAdapter } from "../../utils/promiseFromEvent"

export const OAUTH_REDIRECT_URI = `${vscode.env.uriScheme}://gitlab.gitlab-workflow/authentication`

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
/** Parameters used to exchange code for token with the GitLab OAuth service */
type TokenExchangeUrlParams = AuthorizationCodeTokenExchangeParams | RefreshTokenExchangeParams

class GitLabUriHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
  async handleUri(uri: vscode.Uri): Promise<void> {
    this.fire(uri)
  }
}

const gitlabUriHandler = new GitLabUriHandler()

const generateSecret = (): string => {
  let secret = ""
  const length = Math.floor(Math.random() * 11) + 50 // Randomly choose any number between 50 and 60 inclusive
  while (secret.length < length) {
    secret += uuidv4().replace(/-/g, "")
  }
  return secret.substr(0, length)
}

export class GitlabOAuth {
  #requestsInProgress: Record<string, string> = {}

  #uriHandler: GitLabUriHandler

  constructor(uh = gitlabUriHandler) {
    this.#uriHandler = uh
  }

  supportsGitLabInstance(url: string): boolean {
    const clientId = getAuthenticationConfiguration().oauthClientIds[url]
    return clientId !== undefined && clientId !== null && clientId !== ""
  }

  async authenticate(url: string) {
    if (this.supportsGitLabInstance(url)) {
      return this.#createAccount(url, ["api"])
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
      vscode.Uri,
      ExchangeTokenResponse
    >(this.#uriHandler.event, this.#exchangeCodeForToken(instanceUrl, state, scopes, clientId))
    await vscode.env.openExternal(vscode.Uri.parse(url))
    const account = await vscode.window.withProgress(
      {
        title: `Waiting for OAuth redirect from ${instanceUrl}.`,
        location: vscode.ProgressLocation.Notification,
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
          cancelWaitingForRedirectUrl.fire()
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
      `redirect_uri=${OAUTH_REDIRECT_URI}`,
      `grant_type=${params.grantType}`,
    ]
    const grantTypeParams =
      params.grantType === "authorization_code"
        ? [`code=${params.code}`, `code_verifier=${params.codeVerifier}`]
        : [`refresh_token=${params.refreshToken}`]

    const response = await this.#crossFetch(`${params.instanceUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: [...commonParams, ...grantTypeParams].join("&"),
    })
    const result = await response.json()
    assert(result.access_token, "Refresh token response is missing access token.")
    assert(result.refresh_token, "Refresh token response is missing refresh token.")
    return result
  }

  createOAuthAccountFromCode = async (
    params: AuthorizationCodeTokenExchangeParams & { scopes: readonly string[] },
    clientId: string,
  ): Promise<ExchangeTokenResponse> => {
    const { code, codeVerifier } = params
    const tokenResponse = await this.exchangeToken(
      {
        instanceUrl: params.instanceUrl,
        grantType: "authorization_code",
        code,
        codeVerifier,
      },
      clientId,
    )

    return tokenResponse
  }

  async #crossFetch(input: URL | RequestInfo, init: RequestInit = {}): Promise<Response> {
    return await fetch(input, {
      ...init,
      headers: {
        Connection: "keep-alive",
      },
      signal: AbortSignal.timeout(30000),
    })
  }

  generateCodeChallengeFromVerifier = (v: string) => {
    const sha256 = (plain: string) => {
      const encoder = new TextEncoder()
      const data = encoder.encode(plain)
      return crypto.createHash("sha256").update(data)
    }
    return sha256(v).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
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
    const redirectUri = OAUTH_REDIRECT_URI
    const codeVerifier = generateSecret()
    const codeChallenge = this.generateCodeChallengeFromVerifier(codeVerifier)
    const scopes = (scopesParam ?? ["api"]).join(" ")
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
  ) => PromiseAdapter<vscode.Uri, ExchangeTokenResponse> =
    /* This callback is triggered on every vscode://gitlab-workflow URL.
    We will ignore invocations that are not related to the OAuth login with given `state`. */
    (instanceUrl, state, scopes, clientId) =>
      async (
        uri: vscode.Uri,
        resolve: (value: ExchangeTokenResponse) => void,
        reject: (reason?: any) => void,
      ) => {
        if (uri.path !== "/authentication") return
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
          reject(new Error(`Authentication URL ${uri} didn't contain 'code' query param.`))
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

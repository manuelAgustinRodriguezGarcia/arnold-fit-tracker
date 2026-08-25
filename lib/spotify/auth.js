import {
  getSpotifyClientId,
  getSpotifyRedirectUri,
  MESSAGES,
  SPOTIFY_AUTHORIZE_URL,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_URL,
} from "./constants";
import {
  clearPkceSession,
  clearSpotifyStorage,
  getPkceVerifier,
  getOauthState,
  getRefreshToken,
  getReturnUrl,
  savePkceSession,
  saveTokens,
} from "./storage";

const VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export class SpotifyAuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SpotifyAuthError";
    this.code = code;
  }
}

function randomString(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let index = 0; index < bytes.length; index += 1) {
    result += VERIFIER_CHARS[bytes[index] % VERIFIER_CHARS.length];
  }
  return result;
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

function safeReturnPath() {
  if (typeof window === "undefined") {
    return "/";
  }
  const path = `${window.location.pathname}${window.location.search}`;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/spotify/callback")) {
    return "/";
  }
  return path;
}

export async function startSpotifyLogin() {
  const clientId = getSpotifyClientId();
  if (!clientId) {
    throw new SpotifyAuthError("missing_client_id", "Falta configurar Spotify.");
  }

  const verifier = randomString(64);
  const state = randomString(32);
  const challenge = await createCodeChallenge(verifier);
  const redirectUri = getSpotifyRedirectUri();

  savePkceSession({
    verifier,
    state,
    returnUrl: safeReturnPath(),
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });

  const authorizeUrl = new URL(SPOTIFY_AUTHORIZE_URL);
  authorizeUrl.search = params.toString();
  window.location.href = authorizeUrl.href;
}

async function requestTokens(body) {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    const error = payload?.error;
    if (error === "invalid_grant") {
      throw new SpotifyAuthError("invalid_grant", MESSAGES.reconnect);
    }
    throw new SpotifyAuthError("token_failed", MESSAGES.connectFailed);
  }

  saveTokens({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
  });

  return payload;
}

export async function completeSpotifyCallback(searchParams) {
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!error && !code) {
    throw new SpotifyAuthError("missing_params", MESSAGES.connectFailed);
  }

  if (error === "access_denied") {
    clearPkceSession();
    throw new SpotifyAuthError("denied", MESSAGES.denied);
  }
  if (error) {
    clearPkceSession();
    throw new SpotifyAuthError("oauth_error", MESSAGES.connectFailed);
  }

  const expectedState = getOauthState();
  const verifier = getPkceVerifier();
  const returnUrl = getReturnUrl();

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    clearPkceSession();
    throw new SpotifyAuthError("invalid_state", MESSAGES.connectFailed);
  }

  try {
    await requestTokens(
      new URLSearchParams({
        client_id: getSpotifyClientId(),
        grant_type: "authorization_code",
        code,
        redirect_uri: getSpotifyRedirectUri(),
        code_verifier: verifier,
      }),
    );
  } finally {
    clearPkceSession();
  }

  return returnUrl;
}

let refreshPromise = null;

export async function refreshSpotifyAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    const clientId = getSpotifyClientId();
    if (!refreshToken || !clientId) {
      clearSpotifyStorage();
      throw new SpotifyAuthError("invalid_grant", MESSAGES.reconnect);
    }

    try {
      return await requestTokens(
        new URLSearchParams({
          client_id: clientId,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      );
    } catch (error) {
      if (error instanceof SpotifyAuthError && error.code === "invalid_grant") {
        clearSpotifyStorage();
      }
      throw error;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export function disconnectSpotify() {
  clearSpotifyStorage();
}

import { SpotifyAuthError, refreshSpotifyAccessToken } from "./auth";
import {
  MESSAGES,
  PLAYLIST_MAX_ITEMS,
  PLAYLIST_PAGE_SIZE,
  SPOTIFY_API_BASE,
  TOKEN_REFRESH_SKEW_MS,
} from "./constants";
import { SpotifyApiError } from "./errors";
import { getAccessToken, getExpiresAt, hasSpotifySession } from "./storage";

let rateLimitedUntil = 0;

export function getSpotifyRateLimitedUntil() {
  return rateLimitedUntil;
}

export function isSpotifyRateLimited() {
  return Date.now() < rateLimitedUntil;
}

function resolveUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${SPOTIFY_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function retryAfterMs(response) {
  const header = response.headers.get("Retry-After");
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds, 60) * 1000;
  }
  return 15_000;
}

async function readBody(response) {
  if (response.status === 204 || response.status === 202) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function mapFailure(response, body) {
  const status = response.status;
  const reason = body?.error?.reason;
  const apiMessage = body?.error?.message;

  if (status === 401) {
    return new SpotifyApiError("unauthorized", MESSAGES.reconnect, status);
  }
  if (status === 429) {
    const wait = retryAfterMs(response);
    rateLimitedUntil = Date.now() + wait;
    return new SpotifyApiError("rate_limit", MESSAGES.rateLimited, status, wait);
  }
  if (status === 404 || reason === "NO_ACTIVE_DEVICE") {
    return new SpotifyApiError("no_device", MESSAGES.noDevice, status);
  }
  if (status === 403) {
    if (reason === "PREMIUM_REQUIRED" || /premium/i.test(apiMessage || "")) {
      return new SpotifyApiError("premium", MESSAGES.premium, status);
    }
    return new SpotifyApiError("forbidden", MESSAGES.restricted, status);
  }
  return new SpotifyApiError("unknown", MESSAGES.playFailed, status);
}

async function ensureAccessToken() {
  if (!hasSpotifySession()) {
    throw new SpotifyApiError("unauthorized", MESSAGES.reconnect, 401);
  }
  const expiresAt = getExpiresAt();
  if (!getAccessToken() || expiresAt - Date.now() < TOKEN_REFRESH_SKEW_MS) {
    await refreshSpotifyAccessToken();
  }
  const token = getAccessToken();
  if (!token) {
    throw new SpotifyApiError("unauthorized", MESSAGES.reconnect, 401);
  }
  return token;
}

export async function spotifyFetch(path, options = {}, retried = false) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new SpotifyApiError("offline", MESSAGES.offline);
  }

  if (isSpotifyRateLimited()) {
    throw new SpotifyApiError(
      "rate_limit",
      MESSAGES.rateLimited,
      429,
      Math.max(0, rateLimitedUntil - Date.now()),
    );
  }

  let token;
  try {
    token = await ensureAccessToken();
  } catch (error) {
    if (error instanceof SpotifyAuthError) {
      throw new SpotifyApiError("unauthorized", error.message, 401);
    }
    throw error;
  }

  let response;
  try {
    response = await fetch(resolveUrl(path), {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new SpotifyApiError("network", MESSAGES.offline);
  }

  const body = await readBody(response);

  if (response.status === 401 && !retried) {
    try {
      await refreshSpotifyAccessToken();
    } catch {
      throw new SpotifyApiError("unauthorized", MESSAGES.reconnect, 401);
    }
    return spotifyFetch(path, options, true);
  }

  if (!response.ok) {
    throw mapFailure(response, body);
  }

  return body;
}

export async function getPlaybackState() {
  try {
    return await spotifyFetch("/me/player?additional_types=episode");
  } catch (error) {
    if (error instanceof SpotifyApiError && error.code === "no_device") {
      return null;
    }
    throw error;
  }
}

export async function pausePlayback() {
  return spotifyFetch("/me/player/pause", { method: "PUT" });
}

export async function resumePlayback() {
  return spotifyFetch("/me/player/play", { method: "PUT" });
}

export async function skipToNext() {
  return spotifyFetch("/me/player/next", { method: "POST" });
}

export async function skipToPrevious() {
  return spotifyFetch("/me/player/previous", { method: "POST" });
}

export async function seekPlayback(positionMs) {
  const safe = Math.max(0, Math.floor(positionMs));
  return spotifyFetch(`/me/player/seek?position_ms=${safe}`, { method: "PUT" });
}

export async function playContext(contextUri) {
  return spotifyFetch("/me/player/play", {
    method: "PUT",
    body: JSON.stringify({ context_uri: contextUri }),
  });
}

export async function setShuffle(enabled) {
  return spotifyFetch(`/me/player/shuffle?state=${enabled ? "true" : "false"}`, {
    method: "PUT",
  });
}

export async function setRepeatMode(mode) {
  return spotifyFetch(`/me/player/repeat?state=${encodeURIComponent(mode)}`, {
    method: "PUT",
  });
}

export async function getUserPlaylists() {
  const items = [];
  let path = `/me/playlists?limit=${PLAYLIST_PAGE_SIZE}`;

  while (path) {
    const page = await spotifyFetch(path);
    items.push(...(page?.items || []));
    if (items.length >= PLAYLIST_MAX_ITEMS || !page?.next) {
      break;
    }
    path = page.next;
  }

  return items;
}

import { SPOTIFY_KEY_PREFIX, SPOTIFY_STORAGE_KEYS } from "./constants";

export const SPOTIFY_SESSION_EVENT = "arnold-spotify-session";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitSessionChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(SPOTIFY_SESSION_EVENT));
}

function read(key) {
  if (!canUseStorage()) {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error("Arnold: no se pudo leer almacenamiento de Spotify", error);
    return null;
  }
}

function write(key, value) {
  if (!canUseStorage()) {
    return false;
  }
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, String(value));
    }
    return true;
  } catch (error) {
    console.error("Arnold: no se pudo escribir almacenamiento de Spotify", error);
    return false;
  }
}

export function getAccessToken() {
  return read(SPOTIFY_STORAGE_KEYS.accessToken);
}

export function getRefreshToken() {
  return read(SPOTIFY_STORAGE_KEYS.refreshToken);
}

export function getExpiresAt() {
  const raw = read(SPOTIFY_STORAGE_KEYS.expiresAt);
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function saveTokens({ accessToken, refreshToken, expiresIn }) {
  if (accessToken) {
    write(SPOTIFY_STORAGE_KEYS.accessToken, accessToken);
  }
  if (refreshToken) {
    write(SPOTIFY_STORAGE_KEYS.refreshToken, refreshToken);
  }
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) {
    write(SPOTIFY_STORAGE_KEYS.expiresAt, String(Date.now() + expiresIn * 1000));
  }
  emitSessionChange();
}

export function hasSpotifySession() {
  return Boolean(getRefreshToken() || getAccessToken());
}

export function savePkceSession({ verifier, state, returnUrl }) {
  write(SPOTIFY_STORAGE_KEYS.pkceVerifier, verifier);
  write(SPOTIFY_STORAGE_KEYS.oauthState, state);
  write(SPOTIFY_STORAGE_KEYS.returnUrl, returnUrl || "/");
}

export function getPkceVerifier() {
  return read(SPOTIFY_STORAGE_KEYS.pkceVerifier);
}

export function getOauthState() {
  return read(SPOTIFY_STORAGE_KEYS.oauthState);
}

export function getReturnUrl() {
  const value = read(SPOTIFY_STORAGE_KEYS.returnUrl);
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/spotify/callback")) {
    return "/";
  }
  return value;
}

export function clearPkceSession() {
  write(SPOTIFY_STORAGE_KEYS.pkceVerifier, null);
  write(SPOTIFY_STORAGE_KEYS.oauthState, null);
  write(SPOTIFY_STORAGE_KEYS.returnUrl, null);
}

export function clearSpotifyStorage() {
  if (!canUseStorage()) {
    return;
  }
  try {
    const keys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(SPOTIFY_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
    emitSessionChange();
  } catch (error) {
    console.error("Arnold: no se pudo limpiar almacenamiento de Spotify", error);
  }
}

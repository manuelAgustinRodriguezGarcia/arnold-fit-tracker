export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

export const SPOTIFY_CALLBACK_PATH = "/spotify/callback";

export const SPOTIFY_STORAGE_KEYS = {
  accessToken: "arnold_spotify_access_token",
  refreshToken: "arnold_spotify_refresh_token",
  expiresAt: "arnold_spotify_expires_at",
  pkceVerifier: "arnold_spotify_pkce_verifier",
  oauthState: "arnold_spotify_oauth_state",
  returnUrl: "arnold_spotify_return_url",
};

export const SPOTIFY_KEY_PREFIX = "arnold_spotify_";

export const TOKEN_REFRESH_SKEW_MS = 60_000;
export const PLAYBACK_POLL_COMPACT_MS = 10_000;
export const PLAYBACK_POLL_EXPANDED_MS = 5_000;
export const ACTION_REFRESH_DELAY_MS = 550;
export const SKIP_LOCK_MS = 650;
export const LOCAL_PROGRESS_TICK_MS = 250;
export const PLAYLIST_PAGE_SIZE = 50;
export const PLAYLIST_MAX_ITEMS = 200;

export const MESSAGES = {
  reconnect: "Volvé a conectar Spotify",
  connectFailed: "No pudimos conectar con Spotify.",
  noDevice: "No hay un dispositivo Spotify activo. Abrí Spotify en tu celular y reproducí algo primero.",
  noDeviceShort: "Abrí Spotify en tu dispositivo primero.",
  skipFailed: "No pudimos cambiar de canción.",
  seekFailed: "No pudimos cambiar la posición.",
  playFailed: "No pudimos controlar la reproducción.",
  playlistFailed: "No pudimos reproducir esa playlist.",
  playlistsFailed: "No pudimos cargar tus playlists.",
  rateLimited: "Spotify está limitando temporalmente las solicitudes.",
  offline: "Spotify no disponible sin conexión",
  idle: "Abrí Spotify y reproducí una canción",
  denied: "Cancelaste la conexión con Spotify.",
  premium: "Esta acción no está disponible en tu cuenta de Spotify.",
  restricted: "Spotify restringió esta acción por ahora.",
};

export function getSpotifyClientId() {
  return (process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "").trim().replace(/;+$/, "");
}

export function getSpotifyRedirectUri() {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.origin}${SPOTIFY_CALLBACK_PATH}`;
}

import { MESSAGES } from "./constants";

export class SpotifyApiError extends Error {
  constructor(code, message, status = 0, retryAfterMs = 0) {
    super(message);
    this.name = "SpotifyApiError";
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export function userFacingSpotifyMessage(error) {
  if (!error) {
    return MESSAGES.playFailed;
  }
  if (error.code === "offline" || error.code === "network") {
    return MESSAGES.offline;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return MESSAGES.playFailed;
}

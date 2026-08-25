function pickImage(images, size) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }
  if (size === "small") {
    return images[images.length - 1]?.url || images[0]?.url || null;
  }
  const preferred = images.find((image) => (image?.width || 0) >= 300) || images[0];
  return preferred?.url || null;
}

function namesFromArtists(artists) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return "";
  }
  return artists
    .map((artist) => artist?.name)
    .filter(Boolean)
    .join(", ");
}

const REPEAT_MODES = ["off", "context", "track"];

export function normalizeRepeatMode(value) {
  return REPEAT_MODES.includes(value) ? value : "off";
}

export function getNextRepeatMode(currentMode) {
  if (currentMode === "off") {
    return "context";
  }
  if (currentMode === "context") {
    return "track";
  }
  return "off";
}

export function formatPlaybackTime(ms) {
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function normalizePlayback(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw.item || null;
  const isAd = raw.currently_playing_type === "ad";
  const isEpisode = item?.type === "episode";
  const disallows = raw.actions?.disallows || {};

  let title = "";
  let artist = "";
  let album = "";
  let imageUrl = null;
  let imageUrlSmall = null;

  if (isAd && !item) {
    title = "Anuncio";
    artist = "Spotify";
  } else if (isEpisode) {
    title = item.name || "Episodio";
    artist = item.show?.name || "";
    album = item.show?.name || "";
    const images = item.images?.length ? item.images : item.show?.images;
    imageUrl = pickImage(images, "large");
    imageUrlSmall = pickImage(images, "small");
  } else if (item) {
    title = item.name || "Canción";
    artist = namesFromArtists(item.artists);
    album = item.album?.name || "";
    imageUrl = pickImage(item.album?.images, "large");
    imageUrlSmall = pickImage(item.album?.images, "small");
  }

  const durationMs = Number(item?.duration_ms) || 0;
  const progressMs = Math.min(Math.max(0, Number(raw.progress_ms) || 0), durationMs || Number(raw.progress_ms) || 0);

  return {
    trackId: item?.id || (isAd ? "ad" : null),
    title,
    artist,
    album,
    imageUrl,
    imageUrlSmall: imageUrlSmall || imageUrl,
    durationMs,
    progressMs,
    isPlaying: Boolean(raw.is_playing),
    isAd,
    isEpisode,
    device: raw.device
      ? {
          id: raw.device.id || null,
          name: raw.device.name || "",
          isActive: Boolean(raw.device.is_active),
        }
      : null,
    shuffleEnabled: Boolean(raw.shuffle_state),
    repeatMode: normalizeRepeatMode(raw.repeat_state),
    canSeek: !disallows.seeking && durationMs > 0 && !isAd,
    canSkipNext: !disallows.skipping_next && !isAd,
    canSkipPrevious: !disallows.skipping_prev && !isAd,
    canPause: !disallows.pausing,
    canPlay: !disallows.resuming,
    canShuffle: !disallows.toggling_shuffle && !isAd,
    canRepeat:
      !isAd &&
      !(disallows.toggling_repeat_context && disallows.toggling_repeat_track),
  };
}

export function normalizePlaylist(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const total = raw.tracks?.total;
  return {
    id: raw.id,
    uri: raw.uri,
    name: raw.name || "Playlist",
    imageUrl: pickImage(raw.images, "small"),
    trackCount: typeof total === "number" ? total : null,
  };
}

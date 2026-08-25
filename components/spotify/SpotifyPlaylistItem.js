"use client";

import { ChevronRight } from "lucide-react";
import { SpotifyCover } from "@/components/spotify/SpotifyCover";
import styles from "./SpotifyPlaylists.module.css";

export function SpotifyPlaylistItem({ playlist, busy, onSelect }) {
  const countLabel =
    typeof playlist.trackCount === "number"
      ? `${playlist.trackCount} ${playlist.trackCount === 1 ? "canción" : "canciones"}`
      : null;

  return (
    <button
      type="button"
      className={styles.item}
      onClick={() => onSelect(playlist)}
      disabled={busy}
      aria-label={`Reproducir ${playlist.name}`}
    >
      <SpotifyCover src={playlist.imageUrl} alt="" size="md" />
      <span className={styles.meta}>
        <strong>{playlist.name}</strong>
        {countLabel ? <span>{countLabel}</span> : null}
      </span>
      {busy ? <span className={styles.spinner} aria-hidden="true" /> : <ChevronRight size={18} />}
    </button>
  );
}

"use client";

import { SpotifyPlaylistItem } from "@/components/spotify/SpotifyPlaylistItem";
import styles from "./SpotifyPlaylists.module.css";

export function SpotifyPlaylists({
  playlists,
  loading,
  error,
  startingPlaylistId,
  onSelect,
}) {
  return (
    <section className={styles.section} aria-label="Tus playlists">
      <h3 className={styles.heading}>Tus playlists</h3>
      {loading ? (
        <div className={styles.list} aria-busy="true" aria-label="Cargando playlists">
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : null}
      {!loading && error ? <p className={styles.error}>{error}</p> : null}
      {!loading && !error && playlists.length === 0 ? (
        <p className={styles.empty}>No encontramos playlists en esta cuenta.</p>
      ) : null}
      {!loading && playlists.length > 0 ? (
        <div className={styles.list}>
          {playlists.map((playlist) => (
            <SpotifyPlaylistItem
              key={playlist.id || playlist.uri}
              playlist={playlist}
              busy={startingPlaylistId === playlist.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

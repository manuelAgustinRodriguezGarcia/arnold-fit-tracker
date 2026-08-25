"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SpotifyPlaylistItem } from "@/components/spotify/SpotifyPlaylistItem";
import { SEARCH_FIELD } from "@/lib/inputAttrs";
import styles from "./SpotifyPlaylists.module.css";

function getVisiblePlaylists(playlists, playlistSearch, playlistSort) {
  const query = playlistSearch.trim().toLocaleLowerCase();
  const filtered = query
    ? playlists.filter((playlist) =>
        String(playlist.name || "").toLocaleLowerCase().includes(query),
      )
    : playlists;

  return [...filtered].sort((a, b) => {
    const comparison = String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    });
    return playlistSort === "desc" ? -comparison : comparison;
  });
}

export function SpotifyPlaylists({
  playlists,
  loading,
  error,
  startingPlaylistId,
  onSelect,
}) {
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [playlistSort, setPlaylistSort] = useState("asc");
  const hasPlaylists = playlists.length > 0;
  const visiblePlaylists = useMemo(
    () => getVisiblePlaylists(playlists, playlistSearch, playlistSort),
    [playlists, playlistSearch, playlistSort],
  );
  const noSearchMatches = hasPlaylists && visiblePlaylists.length === 0;

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
      {!loading && !error && !hasPlaylists ? (
        <p className={styles.empty}>Todavía no tenés playlists disponibles.</p>
      ) : null}
      {!loading && hasPlaylists ? (
        <>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">Buscar playlists</span>
              <input
                {...SEARCH_FIELD}
                value={playlistSearch}
                onChange={(event) => setPlaylistSearch(event.target.value)}
                placeholder="Buscar playlist..."
                aria-label="Buscar playlists"
              />
            </label>
            <button
              type="button"
              className={styles.sort}
              onClick={() =>
                setPlaylistSort((current) => (current === "asc" ? "desc" : "asc"))
              }
              aria-label={
                playlistSort === "asc"
                  ? "Ordenar A-Z. Cambiar a Z-A"
                  : "Ordenar Z-A. Cambiar a A-Z"
              }
              aria-pressed={playlistSort === "desc"}
            >
              {playlistSort === "asc" ? "A-Z" : "Z-A"}
            </button>
          </div>
          {noSearchMatches ? (
            <div className={styles.emptyState}>
              <p className={styles.empty}>No encontramos playlists con esa búsqueda.</p>
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setPlaylistSearch("")}
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {visiblePlaylists.map((playlist) => (
                <SpotifyPlaylistItem
                  key={playlist.id || playlist.uri}
                  playlist={playlist}
                  busy={startingPlaylistId === playlist.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

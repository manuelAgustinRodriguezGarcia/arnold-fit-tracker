"use client";

import { useEffect, useRef, useState } from "react";
import { SpotifyCover } from "@/components/spotify/SpotifyCover";
import { SpotifyPlaybackControls } from "@/components/spotify/SpotifyPlaybackControls";
import { SpotifyPlaylists } from "@/components/spotify/SpotifyPlaylists";
import { SpotifyProgress } from "@/components/spotify/SpotifyProgress";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import styles from "./SpotifyPlayerSheet.module.css";

const EXIT_MS = 200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SpotifyPlayerSheet({
  open,
  playback,
  displayedProgressMs,
  playlists,
  playlistsLoading,
  playlistsError,
  skipBusy,
  startingPlaylistId,
  error,
  isOnline,
  onClose,
  onPrevious,
  onToggle,
  onNext,
  onSeekStart,
  onSeekInput,
  onSeekCommit,
  onSelectPlaylist,
  restoreFocusRef,
}) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const exitTimeoutRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const visibleRef = useRef(open);

  visibleRef.current = visible;
  onCloseRef.current = onClose;
  useBodyScrollLock(visible);

  function clearExitTimeout() {
    if (exitTimeoutRef.current) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = 0;
    }
  }

  function playExit(after) {
    if (prefersReducedMotion()) {
      setVisible(false);
      setClosing(false);
      after?.();
      return;
    }
    setClosing(true);
    clearExitTimeout();
    exitTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
      after?.();
    }, EXIT_MS);
  }

  useEffect(() => {
    if (open) {
      clearExitTimeout();
      setVisible(true);
      setClosing(false);
      return undefined;
    }
    if (!visibleRef.current) {
      return undefined;
    }
    playExit();
    return () => clearExitTimeout();
  }, [open]);

  useEffect(() => {
    return () => clearExitTimeout();
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    previousFocusRef.current =
      restoreFocusRef?.current ||
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const frame = window.requestAnimationFrame(() => {
      sheetRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, restoreFocusRef]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      return undefined;
    }
    const target = previousFocusRef.current;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
    return undefined;
  }, [visible]);

  if (!visible) {
    return null;
  }

  const idle = !playback;
  let subtitle = playback?.artist || "";
  if (idle) {
    subtitle = isOnline
      ? error || "Abrí Spotify y reproducí una canción"
      : "Spotify no disponible sin conexión";
  }

  return (
    <div className={`${styles.overlay} ${closing ? styles.closing : ""}`}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Contraer reproductor"
        onClick={() => onCloseRef.current()}
      />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotify-sheet-title"
        tabIndex={-1}
      >
        <div className={styles.handleWrap}>
          <button
            type="button"
            className={styles.handleButton}
            aria-label="Contraer reproductor"
            onClick={() => onCloseRef.current()}
          >
            <span className={styles.handle} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.player}>
          <SpotifyCover
            src={playback?.imageUrl}
            alt={playback?.album || playback?.title || ""}
            size="lg"
          />
          <h2 id="spotify-sheet-title" className={styles.title}>
            {idle ? "Spotify" : playback.title}
          </h2>
          <p className={styles.artist}>{subtitle}</p>
          <SpotifyProgress
            value={displayedProgressMs}
            max={playback?.durationMs || 0}
            disabled={!playback?.canSeek}
            onSeekStart={onSeekStart}
            onSeekInput={onSeekInput}
            onSeekCommit={onSeekCommit}
          />
          <SpotifyPlaybackControls
            size="lg"
            isPlaying={Boolean(playback?.isPlaying)}
            canPlay={idle ? false : playback.canPlay}
            canPause={idle ? false : playback.canPause}
            canSkipPrevious={idle ? false : playback.canSkipPrevious}
            canSkipNext={idle ? false : playback.canSkipNext}
            skipBusy={skipBusy}
            onPrevious={onPrevious}
            onToggle={onToggle}
            onNext={onNext}
          />
        </div>
        <div className={styles.playlists}>
          <SpotifyPlaylists
            playlists={playlists}
            loading={playlistsLoading}
            error={playlistsError}
            startingPlaylistId={startingPlaylistId}
            onSelect={onSelectPlaylist}
          />
        </div>
      </div>
    </div>
  );
}

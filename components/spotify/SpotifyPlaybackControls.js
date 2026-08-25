"use client";

import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import styles from "./SpotifyPlaybackControls.module.css";

const REPEAT_TITLE = {
  off: "Repetición desactivada",
  context: "Repetir lista",
  track: "Repetir canción",
};

const REPEAT_ACTION_LABEL = {
  off: "Repetir lista",
  context: "Repetir canción",
  track: "Desactivar repetición",
};

export function SpotifyPlaybackControls({
  isPlaying,
  canPlay = true,
  canPause = true,
  canSkipPrevious = true,
  canSkipNext = true,
  canShuffle = false,
  canRepeat = false,
  shuffleEnabled = false,
  repeatMode = "off",
  skipBusy = false,
  shuffleBusy = false,
  repeatBusy = false,
  size = "md",
  onPrevious,
  onToggle,
  onNext,
  onShuffle,
  onRepeat,
}) {
  const playEnabled = isPlaying ? canPause : canPlay;
  const extras = size === "lg";
  const resolvedRepeat = REPEAT_TITLE[repeatMode] ? repeatMode : "off";
  const repeatActive = resolvedRepeat !== "off";

  return (
    <div className={`${styles.row} ${styles[size]}`}>
      {extras ? (
        <IconButton
          label={
            shuffleEnabled
              ? "Desactivar reproducción aleatoria"
              : "Activar reproducción aleatoria"
          }
          title={
            shuffleEnabled
              ? "Desactivar reproducción aleatoria"
              : "Activar reproducción aleatoria"
          }
          aria-pressed={shuffleEnabled}
          onClick={onShuffle}
          disabled={!canShuffle || shuffleBusy}
          className={`${styles.extra} ${shuffleEnabled ? styles.extraActive : ""}`}
        >
          <Shuffle size={22} />
        </IconButton>
      ) : null}
      <IconButton
        label="Canción anterior"
        onClick={onPrevious}
        disabled={!canSkipPrevious || skipBusy}
        className={styles.side}
      >
        <SkipBack size={size === "lg" ? 26 : 18} fill="currentColor" />
      </IconButton>
      <IconButton
        label={isPlaying ? "Pausar" : "Reproducir"}
        onClick={onToggle}
        disabled={!playEnabled}
        className={styles.main}
      >
        {isPlaying ? (
          <Pause size={size === "lg" ? 32 : 20} fill="currentColor" />
        ) : (
          <Play size={size === "lg" ? 32 : 20} fill="currentColor" />
        )}
      </IconButton>
      <IconButton
        label="Canción siguiente"
        onClick={onNext}
        disabled={!canSkipNext || skipBusy}
        className={styles.side}
      >
        <SkipForward size={size === "lg" ? 26 : 18} fill="currentColor" />
      </IconButton>
      {extras ? (
        <IconButton
          label={REPEAT_ACTION_LABEL[resolvedRepeat]}
          title={REPEAT_TITLE[resolvedRepeat]}
          aria-pressed={repeatActive}
          onClick={onRepeat}
          disabled={!canRepeat || repeatBusy}
          className={`${styles.extra} ${repeatActive ? styles.extraActive : ""}`}
        >
          {resolvedRepeat === "track" ? <Repeat1 size={22} /> : <Repeat size={22} />}
        </IconButton>
      ) : null}
    </div>
  );
}

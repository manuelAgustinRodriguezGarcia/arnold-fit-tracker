"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import styles from "./SpotifyPlaybackControls.module.css";

export function SpotifyPlaybackControls({
  isPlaying,
  canPlay = true,
  canPause = true,
  canSkipPrevious = true,
  canSkipNext = true,
  skipBusy = false,
  size = "md",
  onPrevious,
  onToggle,
  onNext,
}) {
  const playEnabled = isPlaying ? canPause : canPlay;

  return (
    <div className={`${styles.row} ${styles[size]}`}>
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
    </div>
  );
}

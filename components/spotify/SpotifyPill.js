"use client";

import { ChevronUp } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { SpotifyCover } from "@/components/spotify/SpotifyCover";
import { SpotifyPlaybackControls } from "@/components/spotify/SpotifyPlaybackControls";
import { MESSAGES } from "@/lib/spotify/constants";
import styles from "./SpotifyPill.module.css";

export function SpotifyPill({
  playback,
  error,
  isOnline,
  skipBusy,
  workoutOpen,
  expanded,
  expandRef,
  onExpand,
  onPrevious,
  onToggle,
  onNext,
}) {
  const idle = !playback;
  const status = !isOnline ? MESSAGES.offline : error || (idle ? MESSAGES.idle : "");

  return (
    <div
      className={`${styles.pill} ${workoutOpen ? styles.workout : ""}`}
      aria-hidden={expanded ? true : undefined}
      {...(expanded ? { inert: true } : {})}
    >
      <button
        ref={expandRef}
        type="button"
        className={styles.info}
        onClick={onExpand}
        aria-label="Expandir reproductor"
      >
        <SpotifyCover
          src={playback?.imageUrlSmall || playback?.imageUrl}
          alt=""
          size="sm"
        />
        <span className={styles.text}>
          <strong>{idle ? "Spotify" : playback.title}</strong>
          <span>{idle ? status : playback.artist || status}</span>
        </span>
      </button>
      {playback ? (
        <SpotifyPlaybackControls
          isPlaying={playback.isPlaying}
          canPlay={playback.canPlay}
          canPause={playback.canPause}
          canSkipPrevious={playback.canSkipPrevious}
          canSkipNext={playback.canSkipNext}
          skipBusy={skipBusy}
          onPrevious={onPrevious}
          onToggle={onToggle}
          onNext={onNext}
        />
      ) : null}
      <IconButton
        ref={expandRef}
        label="Expandir reproductor"
        onClick={onExpand}
        className={styles.expand}
      >
        <ChevronUp size={18} />
      </IconButton>
    </div>
  );
}

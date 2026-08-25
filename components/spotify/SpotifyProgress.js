"use client";

import { useRef } from "react";
import { formatPlaybackTime } from "@/lib/spotify/normalize";
import styles from "./SpotifyProgress.module.css";

export function SpotifyProgress({
  value,
  max,
  disabled,
  onSeekStart,
  onSeekInput,
  onSeekCommit,
}) {
  const duration = Math.max(0, max || 0);
  const progress = Math.max(0, Math.min(duration, value || 0));
  const percent = duration > 0 ? (progress / duration) * 100 : 0;
  const committedRef = useRef(true);

  function beginSeek() {
    committedRef.current = false;
    onSeekStart?.();
  }

  function commit(event) {
    if (committedRef.current || event.currentTarget.disabled) {
      return;
    }
    committedRef.current = true;
    onSeekCommit?.(Number(event.currentTarget.value));
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.time}>{formatPlaybackTime(progress)}</span>
      <input
        type="range"
        className={styles.slider}
        min={0}
        max={duration || 0}
        step={250}
        value={progress}
        disabled={disabled || duration <= 0}
        aria-label="Posición de reproducción"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={progress}
        aria-valuetext={formatPlaybackTime(progress)}
        style={{ "--progress": `${percent}%` }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          beginSeek();
        }}
        onKeyDown={() => beginSeek()}
        onInput={(event) => onSeekInput?.(Number(event.currentTarget.value))}
        onPointerUp={commit}
        onPointerCancel={commit}
        onKeyUp={(event) => {
          if (
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "Home" ||
            event.key === "End"
          ) {
            commit(event);
          }
        }}
      />
      <span className={styles.time}>{formatPlaybackTime(duration)}</span>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { SpotifyCover } from "@/components/spotify/SpotifyCover";
import { SpotifyPlaybackControls } from "@/components/spotify/SpotifyPlaybackControls";
import { SpotifyPlaylists } from "@/components/spotify/SpotifyPlaylists";
import { SpotifyProgress } from "@/components/spotify/SpotifyProgress";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import styles from "./SpotifyPlayerSheet.module.css";

const EXIT_MS = 200;
const DRAG_CLICK_SLOP = 8;
const CLOSE_MIN_PX = 72;
const CLOSE_MAX_PX = 132;
const CLOSE_RATIO = 0.2;
const FLICK_VELOCITY = 0.55;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function closeThreshold(height) {
  return Math.min(CLOSE_MAX_PX, Math.max(CLOSE_MIN_PX, height * CLOSE_RATIO));
}

export function SpotifyPlayerSheet({
  open,
  playback,
  displayedProgressMs,
  playlists,
  playlistsLoading,
  playlistsError,
  skipBusy,
  shuffleBusy,
  repeatBusy,
  startingPlaylistId,
  error,
  isOnline,
  onClose,
  onPrevious,
  onToggle,
  onNext,
  onShuffle,
  onRepeat,
  onSeekStart,
  onSeekInput,
  onSeekCommit,
  onSelectPlaylist,
  restoreFocusRef,
}) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);
  const handleRef = useRef(null);
  const previousFocusRef = useRef(null);
  const exitTimeoutRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const visibleRef = useRef(open);
  const skipExitRef = useRef(false);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startY: 0,
    lastY: 0,
    lastT: 0,
    offset: 0,
    velocity: 0,
    moved: false,
  });

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
      skipExitRef.current = false;
      clearExitTimeout();
      setVisible(true);
      setClosing(false);
      return undefined;
    }
    if (skipExitRef.current || !visibleRef.current) {
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
    const handle = handleRef.current;
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!visible || !handle || !sheet) {
      return undefined;
    }

    const drag = dragRef.current;

    function setOffset(px, withTransition) {
      const next = Math.max(0, px);
      sheet.style.transition = withTransition
        ? `transform ${EXIT_MS}ms var(--ease-in, ease)`
        : "none";
      sheet.style.transform = `translateY(${next}px)`;
      if (backdrop) {
        const height = sheet.getBoundingClientRect().height || 1;
        const progress = Math.min(1, next / closeThreshold(height));
        backdrop.style.transition = withTransition
          ? `opacity ${EXIT_MS}ms ease`
          : "none";
        backdrop.style.opacity = String(1 - progress * 0.6);
      }
    }

    function clearInline() {
      sheet.style.transition = "";
      sheet.style.transform = "";
      sheet.style.animation = "none";
      if (backdrop) {
        backdrop.style.transition = "";
        backdrop.style.opacity = "";
      }
    }

    function finishClose() {
      skipExitRef.current = true;
      visibleRef.current = false;
      setVisible(false);
      setClosing(false);
      onCloseRef.current();
    }

    function onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      drag.active = true;
      drag.pointerId = event.pointerId;
      drag.startY = event.clientY;
      drag.lastY = event.clientY;
      drag.lastT = event.timeStamp;
      drag.offset = 0;
      drag.velocity = 0;
      drag.moved = false;
      sheet.style.animation = "none";
      sheet.classList.add(styles.dragging);
      handle.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      if (!drag.active || event.pointerId !== drag.pointerId) {
        return;
      }
      const dy = event.clientY - drag.startY;
      const dt = Math.max(1, event.timeStamp - drag.lastT);
      drag.velocity = (event.clientY - drag.lastY) / dt;
      drag.lastY = event.clientY;
      drag.lastT = event.timeStamp;
      if (Math.abs(dy) > DRAG_CLICK_SLOP) {
        drag.moved = true;
      }
      if (prefersReducedMotion()) {
        return;
      }
      if (dy > 0) {
        event.preventDefault();
        drag.offset = dy;
        setOffset(dy, false);
      }
    }

    function onPointerUp(event) {
      if (!drag.active || event.pointerId !== drag.pointerId) {
        return;
      }
      drag.active = false;
      const height = sheet.getBoundingClientRect().height || window.innerHeight;
      const dy = Math.max(0, event.clientY - drag.startY);
      if (prefersReducedMotion()) {
        if (dy > DRAG_CLICK_SLOP) {
          finishClose();
        }
        return;
      }
      const shouldClose =
        drag.offset >= closeThreshold(height) ||
        (drag.moved && drag.velocity > FLICK_VELOCITY && drag.offset > DRAG_CLICK_SLOP);

      if (shouldClose) {
        skipExitRef.current = true;
        setOffset(height, true);
        window.setTimeout(finishClose, EXIT_MS);
        return;
      }

      sheet.classList.remove(styles.dragging);

      if (drag.offset > 0) {
        setOffset(0, true);
        window.setTimeout(() => {
          if (!drag.active) {
            clearInline();
          }
        }, EXIT_MS);
      }
    }

    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove, { passive: false });
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);
    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
    };
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
        ref={backdropRef}
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
            ref={handleRef}
            type="button"
            className={styles.handleButton}
            aria-label="Contraer reproductor"
            onClick={(event) => {
              if (dragRef.current.moved) {
                event.preventDefault();
                return;
              }
              onCloseRef.current();
            }}
          >
            <span className={styles.handle} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>
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
              canShuffle={idle ? false : playback.canShuffle}
              canRepeat={idle ? false : playback.canRepeat}
              shuffleEnabled={Boolean(playback?.shuffleEnabled)}
              repeatMode={playback?.repeatMode || "off"}
              skipBusy={skipBusy}
              shuffleBusy={shuffleBusy}
              repeatBusy={repeatBusy}
              onPrevious={onPrevious}
              onToggle={onToggle}
              onNext={onNext}
              onShuffle={onShuffle}
              onRepeat={onRepeat}
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
    </div>
  );
}

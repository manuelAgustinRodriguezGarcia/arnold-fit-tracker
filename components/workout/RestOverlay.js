"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import styles from "./TimedSetOverlay.module.css";
import restStyles from "./RestOverlay.module.css";

const EXIT_MS = 320;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RestOverlay({ restTimer }) {
  const {
    adjustActiveRest,
    skipActiveRest,
    toggleActiveRestPause,
    expireActiveRest,
  } = useArnold();
  const open = Boolean(restTimer);
  const savedRef = useRef(restTimer);
  const lastDisplayMsRef = useRef(0);
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  if (restTimer) {
    savedRef.current = restTimer;
  }

  const timer = restTimer || savedRef.current;
  const paused = Boolean(timer?.pausedAt);

  const finishClose = useEffectEvent(() => {
    setMounted(false);
    setClosing(false);
    setEntered(false);
    closingRef.current = false;
    savedRef.current = null;
    lastDisplayMsRef.current = 0;
  });

  const requestClose = useEffectEvent(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    setClosing(true);
    const delay = prefersReducedMotion() ? 0 : EXIT_MS;
    window.setTimeout(() => {
      finishClose();
    }, delay);
  });

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      setClosing(false);
      const frame = window.requestAnimationFrame(() => {
        setEntered(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (mounted) {
      requestClose();
    }

    return undefined;
  }, [open, mounted]);

  const liveMs = useCountdown(
    open && timer && !paused ? timer.endsAt : null,
    expireActiveRest,
  );
  const remainingMs = paused
    ? Math.max(0, Number(timer?.remainingMs) || 0)
    : liveMs;

  if (open && !closing && remainingMs > 0) {
    lastDisplayMsRef.current = remainingMs;
  }

  const displayMs =
    closing || !open || remainingMs <= 0
      ? lastDisplayMsRef.current
      : remainingMs;
  const canSubtract = displayMs >= 15000;

  if (!mounted || !timer) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${entered ? styles.entered : ""} ${
        closing ? styles.closing : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Descanso"
    >
      <div className={styles.stage}>
        <div className={styles.run}>
          <p className={styles.runLabel}>Descanso</p>
          <p className={styles.runTime} aria-live="polite">
            {formatCountdown(displayMs)}
          </p>
          <p
            className={`${styles.pausedHint} ${
              paused ? styles.pausedHintVisible : ""
            }`}
            aria-hidden={!paused}
          >
            Pausado
          </p>
        </div>
      </div>

      <div className={restStyles.actions}>
        <button
          type="button"
          className={`${styles.action} ${restStyles.square}`}
          onClick={() => adjustActiveRest(-15)}
          disabled={!canSubtract || closing}
          aria-label="Restar 15 segundos"
        >
          <span className={restStyles.delta} aria-hidden="true">
            −15
          </span>
        </button>
        <button
          type="button"
          className={`${styles.action} ${restStyles.square}`}
          onClick={() => adjustActiveRest(15)}
          disabled={closing}
          aria-label="Sumar 15 segundos"
        >
          <span className={restStyles.delta} aria-hidden="true">
            +15
          </span>
        </button>
        <button
          type="button"
          className={`${styles.action} ${restStyles.square}`}
          onClick={toggleActiveRestPause}
          disabled={closing}
          aria-label={paused ? "Reanudar" : "Pausar"}
        >
          {paused ? (
            <Play size={24} strokeWidth={2.4} />
          ) : (
            <Pause size={24} strokeWidth={2.4} />
          )}
        </button>
        <button
          type="button"
          className={`${styles.action} ${restStyles.square}`}
          onClick={skipActiveRest}
          disabled={closing}
          aria-label="Saltar descanso"
        >
          <SkipForward size={24} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

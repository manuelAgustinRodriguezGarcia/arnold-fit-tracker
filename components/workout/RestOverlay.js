"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, SkipForward } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import styles from "./TimedSetOverlay.module.css";
import restStyles from "./RestOverlay.module.css";

const EXIT_MS = 320;
const COLLAPSE_EXIT_MS = 240;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function RestControls({
  expanded,
  canSubtract,
  closing,
  paused,
  onMinimize,
  onExpand,
  onAdjust,
  onTogglePause,
  onSkip,
}) {
  return (
    <div className={restStyles.actions}>
      <button
        type="button"
        className={`${restStyles.square} ${restStyles.minimize}`}
        onClick={expanded ? onMinimize : onExpand}
        disabled={closing}
        aria-label={expanded ? "Minimizar" : "Ampliar"}
      >
        {expanded ? (
          <Minimize2 size={22} strokeWidth={2.4} />
        ) : (
          <Maximize2 size={22} strokeWidth={2.4} />
        )}
      </button>
      <button
        type="button"
        className={`${styles.action} ${restStyles.square}`}
        onClick={() => onAdjust(-15)}
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
        onClick={() => onAdjust(15)}
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
        onClick={onTogglePause}
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
        onClick={onSkip}
        disabled={closing}
        aria-label="Saltar descanso"
      >
        <SkipForward size={24} strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function RestOverlay({
  restTimer,
  expanded = true,
  onExpand,
  onMinimize,
}) {
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
  const expandedRef = useRef(expanded);

  expandedRef.current = expanded;

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
    const reduced = prefersReducedMotion();
    const delay = reduced
      ? 0
      : expandedRef.current
        ? EXIT_MS
        : COLLAPSE_EXIT_MS;
    window.setTimeout(() => {
      finishClose();
    }, delay);
  });

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setEntered(false);
      setMounted(true);
      setClosing(false);
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => {
          setEntered(true);
        });
      });
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
      };
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
  const timeLabel = formatCountdown(displayMs);

  if (!mounted || !timer) {
    return null;
  }

  return (
    <div
      className={`${restStyles.shell} ${entered ? restStyles.entered : ""} ${
        expanded ? restStyles.shellExpanded : restStyles.shellCollapsed
      } ${closing ? restStyles.closing : ""}`}
      role={expanded ? "dialog" : "region"}
      aria-modal={expanded ? true : undefined}
      aria-label="Descanso"
    >
      <div className={restStyles.panel}>
        <div className={restStyles.stage}>
          <button
            type="button"
            className={restStyles.timeHit}
            onClick={() => {
              if (!expanded) {
                onExpand?.();
              }
            }}
            tabIndex={expanded ? -1 : 0}
            aria-label={
              expanded ? undefined : `Descanso ${timeLabel}. Ampliar`
            }
          >
            <p className={restStyles.timeLabel}>Descanso</p>
            <p className={restStyles.timeValue} aria-live="polite">
              {timeLabel}
            </p>
            <p
              className={`${restStyles.timeHint} ${
                paused ? restStyles.timeHintVisible : ""
              }`}
              aria-hidden={!paused}
            >
              Pausado
            </p>
          </button>
        </div>

        <div className={restStyles.footer}>
          <RestControls
            expanded={expanded}
            canSubtract={canSubtract}
            closing={closing}
            paused={paused}
            onMinimize={onMinimize}
            onExpand={onExpand}
            onAdjust={adjustActiveRest}
            onTogglePause={toggleActiveRestPause}
            onSkip={skipActiveRest}
          />
        </div>
      </div>
    </div>
  );
}

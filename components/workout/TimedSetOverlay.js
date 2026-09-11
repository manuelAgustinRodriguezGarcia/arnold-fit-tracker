"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import styles from "./TimedSetOverlay.module.css";

const EXIT_MS = 320;
const COUNTDOWN_SECONDS = 3;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TimedSetOverlay({ session, onClose }) {
  const {
    activeWorkout,
    beginTimedSet,
    finishTimedSet,
    pauseTimedSetTimer,
    resumeTimedSetTimer,
  } = useArnold();
  const startPhase = session?.startPhase || "countdown";
  const [phase, setPhase] = useState(() =>
    startPhase === "countdown" ? "countdown" : startPhase,
  );
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const startedRef = useRef(false);
  const closingRef = useRef(false);
  const lastDisplayMsRef = useRef(0);

  const timedTimer = activeWorkout?.timedTimer;
  const matchingTimer =
    timedTimer &&
    timedTimer.setId === session?.setId &&
    timedTimer.workoutExerciseId === session?.workoutExerciseId
      ? timedTimer
      : null;

  const saved =
    session?.setId && activeWorkout?.timedTimers
      ? activeWorkout.timedTimers[session.setId]
      : null;

  const requestClose = useEffectEvent(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    setClosing(true);
    const delay = prefersReducedMotion() ? 0 : EXIT_MS;
    window.setTimeout(() => {
      onClose?.();
    }, delay);
  });

  const startSet = useEffectEvent(() => {
    if (!session || startedRef.current) {
      return;
    }
    startedRef.current = true;
    beginTimedSet(session.workoutExerciseId, session.setId);
  });

  const remainingMs = useCountdown(
    matchingTimer?.endsAt && phase === "running" && !closing
      ? matchingTimer.endsAt
      : null,
    () => {
      if (matchingTimer && !closingRef.current) {
        finishTimedSet(matchingTimer.workoutExerciseId, matchingTimer.setId);
        requestClose();
      }
    },
  );

  const frozenMs =
    phase === "paused"
      ? Math.max(0, Number(saved?.remainingMs) || remainingMs || 0)
      : 0;

  const liveDisplayMs = phase === "paused" ? frozenMs : remainingMs;
  if (!closing && liveDisplayMs > 0) {
    lastDisplayMsRef.current = liveDisplayMs;
  }
  const displayMs =
    closing || liveDisplayMs <= 0
      ? lastDisplayMsRef.current || liveDisplayMs
      : liveDisplayMs;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    if (startPhase === "running") {
      startSet();
      setPhase("running");
      return undefined;
    }

    if (startPhase === "paused") {
      setPhase("paused");
      return undefined;
    }

    let current = COUNTDOWN_SECONDS;
    setCountdown(current);
    setPhase("countdown");

    const tick = window.setInterval(() => {
      current -= 1;
      if (current <= 0) {
        window.clearInterval(tick);
        startSet();
        setPhase("running");
        return;
      }
      setCountdown(current);
    }, 1000);

    return () => window.clearInterval(tick);
  }, [session?.workoutExerciseId, session?.setId, startPhase]);

  if (!session) {
    return null;
  }

  const title = session.isStretch ? "Elongación" : session.name || "Serie";

  function onPause() {
    if (phase !== "running" || !matchingTimer) {
      return;
    }
    pauseTimedSetTimer();
    setPhase("paused");
  }

  function onResume() {
    if (phase !== "paused") {
      return;
    }
    resumeTimedSetTimer(session.workoutExerciseId, session.setId);
    setPhase("running");
  }

  function onSkip() {
    if (closingRef.current) {
      return;
    }
    if (matchingTimer || phase === "running" || phase === "paused") {
      finishTimedSet(session.workoutExerciseId, session.setId);
    }
    requestClose();
  }

  return (
    <div
      className={`${styles.overlay} ${entered ? styles.entered : ""} ${
        closing ? styles.closing : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.stage}>
        {phase === "countdown" ? (
          <div className={styles.countdown} aria-live="assertive">
            <p className={styles.countdownLabel}>Preparados</p>
            <p className={styles.countdownNumber} key={countdown}>
              {countdown}
            </p>
          </div>
        ) : (
          <div className={styles.run}>
            <p className={styles.runLabel}>{title}</p>
            <p className={styles.runTime} aria-live="polite">
              {formatCountdown(displayMs)}
            </p>
            <p
              className={`${styles.pausedHint} ${
                phase === "paused" ? styles.pausedHintVisible : ""
              }`}
              aria-hidden={phase !== "paused"}
            >
              Pausado
            </p>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {phase === "countdown" ? (
          <button type="button" className={styles.action} onClick={onSkip}>
            <SkipForward size={22} strokeWidth={2.4} />
            Saltar
          </button>
        ) : (
          <>
            <button
              type="button"
              className={styles.action}
              onClick={phase === "paused" ? onResume : onPause}
            >
              {phase === "paused" ? (
                <Play size={22} strokeWidth={2.4} />
              ) : (
                <Pause size={22} strokeWidth={2.4} />
              )}
              {phase === "paused" ? "Reanudar" : "Pausa"}
            </button>
            <button type="button" className={styles.action} onClick={onSkip}>
              <SkipForward size={22} strokeWidth={2.4} />
              Saltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

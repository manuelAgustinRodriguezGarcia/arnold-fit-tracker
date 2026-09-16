"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, SkipForward } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import { getTimedPacePhase } from "@/lib/exercises";
import styles from "./TimedSetOverlay.module.css";
import restStyles from "./RestOverlay.module.css";

const EXIT_MS = 320;
const COLLAPSE_EXIT_MS = 240;
const COUNTDOWN_SECONDS = 3;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TimedControls({
  expanded,
  canSubtract,
  canAdjust,
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
        disabled={!canAdjust || !canSubtract || closing}
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
        disabled={!canAdjust || closing}
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
        disabled={!canAdjust || closing}
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
        aria-label="Saltar"
      >
        <SkipForward size={24} strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function TimedSetOverlay({
  session,
  expanded = true,
  onExpand,
  onMinimize,
  onClose,
  onPacePhaseChange,
}) {
  const {
    activeWorkout,
    beginTimedSet,
    finishTimedSet,
    pauseTimedSetTimer,
    resumeTimedSetTimer,
    adjustTimedSetTimer,
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
  const expandedRef = useRef(expanded);

  expandedRef.current = expanded;

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
    const reduced = prefersReducedMotion();
    const delay = reduced
      ? 0
      : expandedRef.current
        ? EXIT_MS
        : COLLAPSE_EXIT_MS;
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

  useEffect(() => {
    if (!session || closingRef.current || !startedRef.current) {
      return;
    }
    if (phase !== "running" && phase !== "paused") {
      return;
    }
    if (matchingTimer) {
      return;
    }
    if (
      phase === "paused" &&
      (Number(saved?.remainingMs) > 0 ||
        activeWorkout?.pausedTimedSetId === session.setId)
    ) {
      return;
    }
    requestClose();
  }, [
    session,
    phase,
    matchingTimer,
    saved?.remainingMs,
    activeWorkout?.pausedTimedSetId,
  ]);

  const exercise = session
    ? activeWorkout?.exercises?.find(
        (item) => item.workoutExerciseId === session.workoutExerciseId,
      )
    : null;
  const pacePhases = exercise?.pacePhases || null;
  const durationMs = Math.max(
    0,
    Number(matchingTimer?.durationMs) || Number(saved?.durationMs) || 0,
  );
  const elapsedMs =
    session &&
    durationMs > 0 &&
    (phase === "running" || phase === "paused")
      ? Math.max(0, durationMs - displayMs)
      : 0;
  const pacePhase =
    session && (phase === "running" || phase === "paused")
      ? getTimedPacePhase(elapsedMs, durationMs, pacePhases)
      : null;

  useEffect(() => {
    onPacePhaseChange?.(pacePhase);
  }, [pacePhase, onPacePhaseChange]);

  useEffect(() => {
    return () => {
      onPacePhaseChange?.(null);
    };
  }, [onPacePhaseChange]);

  if (!session) {
    return null;
  }

  const title = session.isStretch ? "Elongación" : session.name || "Serie";
  const paused = phase === "paused";
  const canAdjust = phase === "running" || phase === "paused";
  const canSubtract = displayMs >= 15000;
  const timeLabel =
    phase === "countdown" ? String(countdown) : formatCountdown(displayMs);
  const stageLabel =
    phase === "countdown"
      ? ""
      : pacePhase === "start"
        ? "Arranque"
        : pacePhase === "mid"
          ? "Descanso"
          : title;

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

  const controls = (
    <TimedControls
      expanded={expanded}
      canSubtract={canSubtract}
      canAdjust={canAdjust}
      closing={closing}
      paused={paused}
      onMinimize={onMinimize}
      onExpand={onExpand}
      onAdjust={adjustTimedSetTimer}
      onTogglePause={paused ? onResume : onPause}
      onSkip={onSkip}
    />
  );

  const paceClass =
    pacePhase === "start"
      ? restStyles.paceStart
      : pacePhase === "mid"
        ? restStyles.paceMid
        : "";

  return (
    <div
      className={`${restStyles.shell} ${entered ? restStyles.entered : ""} ${
        expanded ? restStyles.shellExpanded : restStyles.shellCollapsed
      } ${paceClass} ${closing ? restStyles.closing : ""}`}
      role={expanded ? "dialog" : "region"}
      aria-modal={expanded ? true : undefined}
      aria-label={stageLabel || title}
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
              expanded
                ? undefined
                : `${stageLabel ? `${stageLabel} ` : ""}${timeLabel}. Ampliar`
            }
          >
            {stageLabel ? (
              <p className={restStyles.timeLabel}>{stageLabel}</p>
            ) : null}
            <p
              className={`${restStyles.timeValue} ${
                phase === "countdown" ? restStyles.timeValueCountdown : ""
              }`}
              aria-live={phase === "countdown" ? "assertive" : "polite"}
            >
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

        <div className={restStyles.footer}>{controls}</div>
      </div>
    </div>
  );
}

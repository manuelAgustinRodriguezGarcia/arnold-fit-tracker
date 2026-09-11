"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { BatteryFull, BatteryLow, BatteryMedium, BicepsFlexed, Clock, Dumbbell, GlassWater, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { DATE_LOCALE, formatDurationHuman, toDate } from "@/lib/dates";
import { EXERCISE_TYPE, formatSeconds } from "@/lib/exercises";
import { getSessionPerformedExerciseCount } from "@/lib/exerciseStats";
import { formatWaterMl } from "@/lib/hydration";
import {
  FATIGUE,
  getFatigueLabel,
  getSessionExercises,
} from "@/lib/workout";
import { getCompletedSets, getExerciseDuration } from "@/lib/workoutSets";
import styles from "./WorkoutCompleteSheet.module.css";

const EXIT_MS = 320;
const ENTER_MS = 420;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readThemeConfettiColors() {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const names = ["--accent", "--accent-secondary", "--accent-tertiary", "--record"];
  const colors = [];
  for (const name of names) {
    probe.style.color = `var(${name})`;
    const color = getComputedStyle(probe).color;
    if (color && color !== "rgba(0, 0, 0, 0)" && !colors.includes(color)) {
      colors.push(color);
    }
  }
  probe.remove();
  return colors.length > 0 ? colors : ["#b39a7c"];
}

function fireAccentConfetti() {
  if (prefersReducedMotion()) {
    return;
  }
  const colors = readThemeConfettiColors();
  const burst = (originX, particleCount) => {
    confetti({
      particleCount,
      spread: 68,
      startVelocity: 42,
      gravity: 0.95,
      ticks: 220,
      origin: { x: originX, y: 0.72 },
      colors,
      disableForReducedMotion: true,
    });
  };
  burst(0.28, 55);
  burst(0.72, 55);
  window.setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      startVelocity: 28,
      gravity: 1.05,
      ticks: 180,
      origin: { x: 0.5, y: 0.62 },
      colors,
      disableForReducedMotion: true,
    });
  }, 180);
}

function FatigueIcon({ value }) {
  let Icon = null;
  switch (value) {
    case FATIGUE.VERY_TIRED:
      Icon = BatteryLow;
      break;
    case FATIGUE.TIRED:
      Icon = BatteryMedium;
      break;
    case FATIGUE.REGULAR:
      Icon = BatteryFull;
      break;
    default:
      break;
  }
  if (!Icon) {
    return null;
  }
  return <Icon size={18} aria-hidden="true" />;
}

function formatExerciseLine(exercise) {
  const completed = getCompletedSets(exercise);
  if (exercise.type === EXERCISE_TYPE.TIMED) {
    const total = getExerciseDuration(exercise);
    return total > 0 ? formatSeconds(total) : "Completado";
  }
  const count = completed.length;
  if (count <= 0) {
    return "Completado";
  }
  return count === 1 ? "1 serie" : `${count} series`;
}

function getCompletedWeekdayTitle(session) {
  const weekday = toDate(session.endedAt || session.startedAt).toLocaleDateString(
    DATE_LOCALE,
    { weekday: "long" },
  );
  return `Entrenamiento del ${weekday} completado`;
}

export function WorkoutCompleteSheet({ session, isDurationRecord, onClose }) {
  const [visible, setVisible] = useState(true);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const exitTimeoutRef = useRef(0);
  const closingRef = useRef(false);
  const confettiFiredRef = useRef(false);

  useBodyScrollLock(visible);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!session || confettiFiredRef.current) {
      return undefined;
    }
    confettiFiredRef.current = true;
    const timer = window.setTimeout(() => {
      fireAccentConfetti();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  function requestClose() {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    if (prefersReducedMotion()) {
      setVisible(false);
      onClose?.();
      return;
    }
    setClosing(true);
    exitTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, EXIT_MS);
  }

  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        requestClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!session || !visible) {
    return null;
  }

  const exercises = getSessionExercises(session).filter(
    (exercise) => getCompletedSets(exercise).length > 0,
  );
  const exerciseCount = getSessionPerformedExerciseCount(session);
  const waterLabel = formatWaterMl(session.waterMl);

  return (
    <div
      className={`${styles.overlay} ${entered ? styles.entered : ""} ${
        closing ? styles.closing : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-complete-title"
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Cerrar"
        onClick={requestClose}
      />
      <div
        className={styles.sheet}
        style={{ "--complete-enter-ms": `${ENTER_MS}ms`, "--complete-exit-ms": `${EXIT_MS}ms` }}
      >
        <div className={styles.body}>
          <div className={styles.heroIcon} aria-hidden="true">
            <BicepsFlexed size={72} strokeWidth={1.75} />
          </div>
          <p className={styles.kicker}>Felicitaciones</p>
          <h2 id="workout-complete-title" className={styles.title}>
            {getCompletedWeekdayTitle(session)}
          </h2>
          <p className={styles.routine}>{session.routineName}</p>

          {isDurationRecord ? (
            <p className={styles.record} role="status">
              <Trophy size={16} aria-hidden="true" />
              Nuevo récord
            </p>
          ) : null}

          <dl className={styles.stats}>
            <div>
              <dt>Duración</dt>
              <dd className={styles.statValue}>
                <Clock size={18} aria-hidden="true" />
                {formatDurationHuman(session.durationSeconds)}
              </dd>
            </div>
            <div>
              <dt>Ejercicios</dt>
              <dd className={styles.statValue}>
                <Dumbbell size={18} aria-hidden="true" />
                {exerciseCount}
              </dd>
            </div>
            <div>
              <dt>Fatiga</dt>
              <dd className={styles.statValue}>
                <FatigueIcon value={session.fatigue} />
                {getFatigueLabel(session.fatigue)}
              </dd>
            </div>
            <div>
              <dt>Agua</dt>
              <dd className={styles.statValue}>
                <GlassWater size={18} aria-hidden="true" />
                {waterLabel || "—"}
              </dd>
            </div>
          </dl>

          {exercises.length > 0 ? (
            <div className={styles.listBlock}>
              <h3 className={styles.listTitle}>Ejercicios</h3>
              <ul className={styles.exercises}>
                {exercises.map((exercise) => (
                  <li key={exercise.workoutExerciseId || exercise.exerciseId || exercise.name}>
                    <span className={styles.exerciseName}>{exercise.name}</span>
                    <span className={styles.exerciseMeta}>
                      {formatExerciseLine(exercise)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className={styles.footer}>
          <Button size="lg" onClick={requestClose}>
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
}

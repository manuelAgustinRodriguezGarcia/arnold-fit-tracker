"use client";

import { RotateCcw, Square } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import { getTimedPacePhase } from "@/lib/exercises";
import styles from "./TimedSetTimer.module.css";

export function TimedSetTimer({
  timedTimer,
  pacePhases = null,
  label = "Serie en curso",
}) {
  const { finishTimedSet, resetTimedSetTimer } = useArnold();
  const remainingMs = useCountdown(timedTimer?.endsAt, () => {
    if (timedTimer) {
      finishTimedSet(timedTimer.workoutExerciseId, timedTimer.setId);
    }
  });

  if (!timedTimer) {
    return null;
  }

  const durationMs = Math.max(
    1,
    Number(timedTimer.durationMs) ||
      new Date(timedTimer.endsAt).getTime() -
        new Date(timedTimer.startedAt || timedTimer.endsAt).getTime() ||
      remainingMs ||
      1,
  );
  const elapsedMs = Math.max(0, durationMs - remainingMs);
  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
  const phase = getTimedPacePhase(elapsedMs, durationMs, pacePhases);
  const phaseLabel =
    phase === "start" ? "Arranque" : phase === "mid" ? "Descanso" : label;

  return (
    <div
      className={`${styles.timer} ${phase === "start" ? styles.start : ""} ${phase === "mid" ? styles.mid : ""}`}
      aria-live="polite"
      style={{ "--progress": String(progress) }}
    >
      <div className={styles.fill} aria-hidden="true" />
      <div className={styles.row}>
        <button
          type="button"
          className={styles.action}
          aria-label="Reiniciar temporizador"
          onClick={() =>
            resetTimedSetTimer(timedTimer.workoutExerciseId, timedTimer.setId)
          }
        >
          <RotateCcw size={20} strokeWidth={2.4} />
        </button>
        <div className={styles.content}>
          <span>{phaseLabel}</span>
          <strong>{formatCountdown(remainingMs)}</strong>
        </div>
        <button
          type="button"
          className={styles.action}
          aria-label="Finalizar serie"
          onClick={() =>
            finishTimedSet(timedTimer.workoutExerciseId, timedTimer.setId)
          }
        >
          <Square size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import styles from "./TimedSetTimer.module.css";

export function TimedSetTimer({ timedTimer }) {
  const { finishTimedSet } = useArnold();
  const remainingMs = useCountdown(timedTimer?.endsAt, () => {
    if (timedTimer) {
      finishTimedSet(timedTimer.workoutExerciseId, timedTimer.setId);
    }
  });

  if (!timedTimer) {
    return null;
  }

  return (
    <div className={styles.timer} aria-live="polite">
      <span>Serie en curso</span>
      <strong>{formatCountdown(remainingMs)}</strong>
    </div>
  );
}
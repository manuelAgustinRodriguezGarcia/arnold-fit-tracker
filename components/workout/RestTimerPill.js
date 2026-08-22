"use client";

import { SkipForward } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import styles from "./RestTimerPill.module.css";

export function RestTimerPill({ restTimer }) {
  const { adjustActiveRest, skipActiveRest, expireActiveRest } = useArnold();
  const remainingMs = useCountdown(restTimer?.endsAt, expireActiveRest);
  const canSubtract = remainingMs >= 15000;

  if (!restTimer) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.pill}>
        <button
          type="button"
          className={`${styles.adjust} ${styles.minus}`}
          onClick={() => adjustActiveRest(-15)}
          disabled={!canSubtract}
          aria-label="Restar 15 segundos"
        >
          −15
        </button>
        <div className={styles.time}>
          <span>Descanso</span>
          <strong>{formatCountdown(remainingMs)}</strong>
        </div>
        <button
          type="button"
          className={`${styles.adjust} ${styles.plus}`}
          onClick={() => adjustActiveRest(15)}
          aria-label="Sumar 15 segundos"
        >
          +15
        </button>
      </div>
      <button type="button" className={styles.skip} onClick={skipActiveRest}>
        <SkipForward size={16} />
        Saltar descanso
      </button>
    </div>
  );
}
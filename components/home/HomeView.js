"use client";

import { ChartNoAxesColumnIncreasing, Dumbbell, Plus, Settings } from "lucide-react";
import { InstallPWA } from "@/components/install/InstallPWA";
import { ActiveWorkoutCard } from "@/components/home/ActiveWorkoutCard";
import { useArnold } from "@/hooks/useArnold";
import {
  formatDurationHuman,
  getPeriodRange,
  getWeekdayName,
  getWeekdayShortLabels,
} from "@/lib/dates";
import { getActivityByDay, getPeriodSessions } from "@/lib/exerciseStats";
import styles from "./HomeView.module.css";

const WEEKDAY_LABELS = getWeekdayShortLabels();

export function HomeView({
  onCreateRoutine,
  onStartWorkout,
  onContinueWorkout,
  onOpenSettings,
}) {
  const { routines, sessions, activeWorkout } = useArnold();

  return (
    <section className={styles.view}>
      <InstallPWA />

      <div className={styles.actions}>
        <button type="button" className={styles.tile} onClick={onCreateRoutine}>
          <Plus size={32} />
          <span className={styles.tileLabel}>Rutina</span>
        </button>
        <button type="button" className={styles.tile} onClick={onOpenSettings}>
          <Settings size={32} />
          <span className={styles.tileLabel}>Ajustes</span>
        </button>
      </div>

      {!activeWorkout ? (
        <button
          type="button"
          className={`${styles.tile} ${styles.tilePrimary}`}
          onClick={onStartWorkout}
          disabled={routines.length === 0}
        >
          <Dumbbell size={32} />
          <span className={styles.tileLabel}>A ENTRENAR</span>
        </button>
      ) : null}

      <WeeklySummary sessions={sessions} />

      {activeWorkout ? (
        <ActiveWorkoutCard
          workout={activeWorkout}
          onContinue={onContinueWorkout}
        />
      ) : null}
    </section>
  );
}

function WeeklySummary({ sessions }) {
  const range = getPeriodRange("week", 0);
  const days = getActivityByDay(getPeriodSessions(sessions, "week", 0), range);
  const max = Math.max(0, ...days.map((day) => day.durationSeconds));

  return (
    <section className={styles.week} aria-label="Actividad de esta semana">
      <div className={styles.weekHeader}>
        <ChartNoAxesColumnIncreasing size={18} />
        <h2>Esta semana</h2>
      </div>
      <div className={styles.bars} role="list">
        {days.map((day, index) => {
          const trained = day.durationSeconds > 0;
          const height = max && trained ? Math.max(8, (day.durationSeconds / max) * 100) : 0;
          const name = getWeekdayName(day.date);
          return (
            <div
              key={day.date.getTime()}
              className={styles.barCol}
              role="listitem"
              aria-label={
                trained
                  ? `${name}, ${formatDurationHuman(day.durationSeconds)}`
                  : `${name}, sin entrenamiento`
              }
            >
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ height: `${height}%` }}>
                  {trained ? (
                    <span className={styles.barTime}>{formatDurationHuman(day.durationSeconds)}</span>
                  ) : null}
                </div>
              </div>
              <span className={styles.barLabel} aria-hidden="true">
                {WEEKDAY_LABELS[index]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

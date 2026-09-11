"use client";

import { Dumbbell, Plus, Settings } from "lucide-react";
import { InstallPWA } from "@/components/install/InstallPWA";
import { ActiveWorkoutCard } from "@/components/home/ActiveWorkoutCard";
import { WeekActivityBars } from "@/components/progress/WeekActivityBars";
import { useArnold } from "@/hooks/useArnold";
import { getPeriodRange } from "@/lib/dates";
import { getActivityByDay, getPeriodSessions } from "@/lib/exerciseStats";
import styles from "./HomeView.module.css";

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

      {activeWorkout ? (
        <ActiveWorkoutCard
          workout={activeWorkout}
          onContinue={onContinueWorkout}
        />
      ) : null}

      <WeeklySummary sessions={sessions} />

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
          <span className={styles.tileLabel}>ENTRENAR</span>
        </button>
      ) : null}
    </section>
  );
}

function WeeklySummary({ sessions }) {
  const range = getPeriodRange("week", 0);
  const weekSessions = getPeriodSessions(sessions, "week", 0);
  const days = getActivityByDay(weekSessions, range);

  return (
    <WeekActivityBars
      sessions={sessions}
      days={days}
      title="Esta semana"
      ariaLabel="Actividad de esta semana"
    />
  );
}

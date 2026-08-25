"use client";

import { ChartNoAxesColumnIncreasing, Play, Plus, Settings } from "lucide-react";
import { InstallPWA } from "@/components/install/InstallPWA";
import { ActiveWorkoutCard } from "@/components/home/ActiveWorkoutCard";
import { useArnold } from "@/hooks/useArnold";
import { formatDurationHuman, getWeeklyStats } from "@/lib/dates";
import styles from "./HomeView.module.css";

export function HomeView({
  onCreateRoutine,
  onStartWorkout,
  onContinueWorkout,
  onOpenSettings,
}) {
  const { routines, sessions, activeWorkout } = useArnold();
  const stats = getWeeklyStats(sessions);

  return (
    <section className={styles.view}>
      <InstallPWA />

      <div className={styles.actions}>
        <button type="button" className={styles.tile} onClick={onCreateRoutine}>
          <Plus size={32} />
          <span className={styles.tileLabel}>
            Crear
            <br />
            rutina
          </span>
        </button>
        <button
          type="button"
          className={`${styles.tile} ${styles.tilePrimary}`}
          onClick={onStartWorkout}
          disabled={Boolean(activeWorkout) || routines.length === 0}
        >
          <Play size={32} />
          <span className={styles.tileLabel}>
            Comenzar
            <br />
            entrenamiento
          </span>
        </button>
      </div>

      <button type="button" className={styles.settings} onClick={onOpenSettings}>
        <Settings size={20} />
        Ajustes
      </button>

      <WeeklySummary stats={stats} />

      {activeWorkout ? (
        <ActiveWorkoutCard
          workout={activeWorkout}
          onContinue={onContinueWorkout}
        />
      ) : null}
    </section>
  );
}

function WeeklySummary({ stats }) {
  return (
    <section className={styles.week}>
      <div className={styles.weekHeader}>
        <ChartNoAxesColumnIncreasing size={18} />
        <h2>Esta semana</h2>
      </div>
      <div className={styles.stats}>
        <article>
          <strong>{stats.exercises}</strong>
          <span>Ejercicios</span>
        </article>
        <article>
          <strong>{formatDurationHuman(stats.durationSeconds)}</strong>
          <span>Tiempo</span>
        </article>
        <article>
          <strong>{stats.trainings}</strong>
          <span>Entrenamientos</span>
        </article>
      </div>
    </section>
  );
}

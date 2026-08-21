"use client";

import { Dumbbell, Play, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InstallPWA } from "@/components/install/InstallPWA";
import { useArnold } from "@/hooks/useArnold";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { formatDurationHuman, getWeeklyStats } from "@/lib/dates";
import { WORKOUT_STATUS } from "@/lib/workout";
import styles from "./HomeView.module.css";

export function HomeView({
  onCreateRoutine,
  onStartWorkout,
  onContinueWorkout,
}) {
  const { routines, sessions, activeWorkout } = useArnold();
  const stats = getWeeklyStats(sessions);
  const { display } = useWorkoutTimer(activeWorkout);

  return (
    <section className={styles.view}>
      <InstallPWA />

      {activeWorkout ? (
        <Card className={styles.activeCard}>
          <p className={styles.kicker}>Entrenamiento en curso</p>
          <h2>{activeWorkout.routineName}</h2>
          <p className={styles.timer}>{display}</p>
          <p className={styles.status}>
            {activeWorkout.status === WORKOUT_STATUS.PAUSED
              ? "Pausado"
              : "En curso"}
          </p>
          <Button
            size="lg"
            icon={<Dumbbell size={18} />}
            onClick={onContinueWorkout}
          >
            Continuar
          </Button>
        </Card>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="lg"
          icon={<Plus size={18} />}
          onClick={onCreateRoutine}
        >
          Crear rutina
        </Button>
        <Button
          size="lg"
          icon={<Play size={18} />}
          onClick={onStartWorkout}
          disabled={Boolean(activeWorkout) || routines.length === 0}
        >
          Comenzar entrenamiento
        </Button>
      </div>

      <WeeklySummary stats={stats} />
    </section>
  );
}

function WeeklySummary({ stats }) {
  return (
    <section className={styles.week}>
      <div className={styles.weekHeader}>
        <Timer size={18} />
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

"use client";

import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { getCurrentSetProgress, WORKOUT_STATUS } from "@/lib/workout";
import styles from "./HomeView.module.css";

export function ActiveWorkoutCard({ workout, onContinue }) {
  const { display } = useWorkoutTimer(workout);
  const progress = getCurrentSetProgress(workout);

  return (
    <Card className={styles.activeCard}>
      <p className={styles.kicker}>Entrenamiento en curso</p>
      <h2>{workout.routineName}</h2>
      {progress ? (
        <>
          <p className={styles.currentExercise}>{progress.exercise.name}</p>
          <p className={styles.setProgress}>
            {progress.complete
              ? "Completado"
              : `Serie ${progress.currentNumber} de ${progress.total}`}
          </p>
        </>
      ) : null}
      <p className={styles.timer}>{display}</p>
      <p className={styles.status}>
        {workout.status === WORKOUT_STATUS.PAUSED ? "Pausado" : "En curso"}
      </p>
      <Button size="lg" icon={<Dumbbell size={18} />} onClick={onContinue}>
        Continuar
      </Button>
    </Card>
  );
}
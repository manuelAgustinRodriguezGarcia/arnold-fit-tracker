"use client";

import { Pencil } from "lucide-react";
import { ExerciseImage } from "@/components/ui/ExerciseImage";
import { IconButton } from "@/components/ui/Button";
import { SetButtons } from "@/components/workout/SetButtons";
import { TimedSetTimer } from "@/components/workout/TimedSetTimer";
import { EXERCISE_TYPE, formatExerciseSummary } from "@/lib/exercises";
import { isStretchExercise } from "@/lib/stretchPresets";
import { isExerciseComplete } from "@/lib/workoutSets";
import styles from "./WorkoutExercise.module.css";

export function WorkoutExercise({
  exercise,
  current,
  timedTimer,
  onToggleSet,
  onEdit,
}) {
  const complete = isExerciseComplete(exercise);

  return (
    <article className={`${styles.card} ${current ? styles.current : ""}`}>
      <div className={styles.top}>
        <ExerciseImage
          imagePath={exercise.imagePath}
          name={exercise.name}
          done={complete}
        />
        <div className={styles.copy}>
          <strong>{exercise.name}</strong>
          <span>{formatExerciseSummary(exercise)}</span>
          {current ? (
            <span className={styles.badge}>
              {complete ? "Último hecho" : "En curso"}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.setsHeader}>
        <p>Series</p>
        <IconButton label="Editar series" onClick={onEdit}>
          <Pencil size={18} />
        </IconButton>
      </div>

      <SetButtons
        sets={exercise.sets}
        onToggle={(set) => onToggleSet(exercise, set)}
      />

      {timedTimer &&
      timedTimer.workoutExerciseId === exercise.workoutExerciseId &&
      exercise.type === EXERCISE_TYPE.TIMED ? (
        <TimedSetTimer
          timedTimer={timedTimer}
          label={
            isStretchExercise(exercise) ? "Elongación en curso" : "Serie en curso"
          }
        />
      ) : null}
    </article>
  );
}
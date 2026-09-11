"use client";

import { Pencil } from "lucide-react";
import { ExerciseImage } from "@/components/ui/ExerciseImage";
import { IconButton } from "@/components/ui/Button";
import { SetButtons } from "@/components/workout/SetButtons";
import { EXERCISE_TYPE, formatCurrentSetSummary } from "@/lib/exercises";
import { isExerciseComplete } from "@/lib/workoutSets";
import styles from "./WorkoutExercise.module.css";

export function WorkoutExercise({
  exercise,
  current,
  onToggleSet,
  onEdit,
}) {
  const complete = isExerciseComplete(exercise);

  return (
    <article
      className={`${styles.card} ${current ? styles.current : ""} ${complete ? styles.complete : ""}`}
    >
      <div className={styles.top}>
        <ExerciseImage
          imagePath={exercise.imagePath}
          name={exercise.name}
          done={complete}
        />
        <div className={styles.copy}>
          <strong>{exercise.name}</strong>
          <div className={styles.meta}>
            <span>{formatCurrentSetSummary(exercise)}</span>
            {current ? (
              <span className={styles.badge}>
                {complete ? "Último hecho" : "En curso"}
              </span>
            ) : null}
          </div>
        </div>
        <IconButton label="Editar series" onClick={onEdit} className={styles.edit}>
          <Pencil size={18} />
        </IconButton>
      </div>

      <SetButtons
        sets={exercise.sets}
        onToggle={(set) => onToggleSet(exercise, set)}
      />
    </article>
  );
}

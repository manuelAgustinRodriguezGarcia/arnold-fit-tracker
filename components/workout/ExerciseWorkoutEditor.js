"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import { EXERCISE_TYPE, parseRepsInput, parseWeightInput } from "@/lib/exercises";
import { getMinSetCount } from "@/lib/workoutSets";
import styles from "./ExerciseWorkoutEditor.module.css";

function DraftInput({
  value,
  onCommit,
  inputMode,
  min,
  step,
  suffix,
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const [source, setSource] = useState(value);

  if (value !== source) {
    setSource(value);
    setText(value == null ? "" : String(value));
  }

  return (
    <div className={suffix ? styles.suffixField : undefined}>
      <input
        inputMode={inputMode}
        min={min}
        step={step}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => onCommit(text)}
      />
      {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
    </div>
  );
}

export function ExerciseWorkoutEditor({ exercise, onClose, onReplace }) {
  const { changeWorkoutSetCount, updateWorkoutSet } = useArnold();

  if (!exercise) {
    return null;
  }

  const minSets = getMinSetCount(exercise);
  const timed = exercise.type === EXERCISE_TYPE.TIMED;

  return (
    <Modal
      open
      title="Editar series"
      onClose={onClose}
      footer={
        <Button variant="secondary" size="lg" onClick={onReplace}>
          Cambiar ejercicio
        </Button>
      }
    >
      <div className={styles.form}>
        <label>
          Cantidad de series
          <input
            type="number"
            inputMode="numeric"
            min={minSets}
            value={exercise.sets.length}
            onChange={(event) =>
              changeWorkoutSetCount(
                exercise.workoutExerciseId,
                Number(event.target.value),
              )
            }
          />
        </label>

        {exercise.sets.map((set) => (
          <div key={set.id} className={styles.set}>
            <p className={styles.setTitle}>Serie {set.number}</p>
            {timed ? (
              <label>
                Tiempo (s)
                <DraftInput
                  value={set.durationSeconds}
                  inputMode="numeric"
                  min="1"
                  onCommit={(text) =>
                    updateWorkoutSet(exercise.workoutExerciseId, set.id, {
                      durationSeconds: Math.max(1, Number(text) || 1),
                    })
                  }
                />
              </label>
            ) : (
              <div className={styles.row}>
                <label>
                  Repeticiones
                  <DraftInput
                    value={set.reps}
                    inputMode="numeric"
                    min="1"
                    onCommit={(text) =>
                      updateWorkoutSet(exercise.workoutExerciseId, set.id, {
                        reps: parseRepsInput(text) ?? set.reps,
                      })
                    }
                  />
                </label>
                <label>
                  Peso
                  <DraftInput
                    value={set.weightKg}
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    suffix="KG"
                    onCommit={(text) =>
                      updateWorkoutSet(exercise.workoutExerciseId, set.id, {
                        weightKg: parseWeightInput(text),
                      })
                    }
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
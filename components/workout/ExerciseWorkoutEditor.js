"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import { EXERCISE_TYPE, parseRepsInput } from "@/lib/exercises";
import { getMinSetCount } from "@/lib/workoutSets";
import styles from "./ExerciseWorkoutEditor.module.css";

function parseDraftWeight(text) {
  if (text === "" || text == null) {
    return { ok: true, value: null };
  }
  const parsed = Number(String(text).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false, value: null };
  }
  return { ok: true, value: parsed };
}

function draftsFromExercise(exercise) {
  return (exercise?.sets || []).map((set) => ({
    id: set.id,
    reps: set.reps == null ? "" : String(set.reps),
    weightKg: set.weightKg == null ? "" : String(set.weightKg),
    durationSeconds: set.durationSeconds == null ? "" : String(set.durationSeconds),
  }));
}

export function ExerciseWorkoutEditor({ exercise, onClose, onReplace }) {
  const { saveWorkoutExercise } = useArnold();
  const minSets = exercise ? getMinSetCount(exercise) : 1;
  const timed = exercise?.type === EXERCISE_TYPE.TIMED;
  const [count, setCount] = useState(() => String(exercise?.sets?.length || 1));
  const [drafts, setDrafts] = useState(() => draftsFromExercise(exercise));
  const [error, setError] = useState("");

  const visibleDrafts = useMemo(() => {
    const nextCount = Math.max(minSets, Math.round(Number(count)) || minSets);
    if (drafts.length === nextCount) {
      return drafts;
    }
    if (drafts.length > nextCount) {
      return drafts.slice(0, nextCount);
    }
    const extras = [];
    const last = drafts[drafts.length - 1];
    for (let index = drafts.length; index < nextCount; index += 1) {
      extras.push({
        id: `draft-${index}`,
        reps: last?.reps ?? "",
        weightKg: last?.weightKg ?? "",
        durationSeconds: last?.durationSeconds ?? "",
      });
    }
    return [...drafts, ...extras];
  }, [count, drafts, minSets]);

  if (!exercise) {
    return null;
  }

  function updateDraft(index, field, value) {
    setDrafts((current) => {
      const next = visibleDrafts.map((item) => ({ ...item }));
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setError("");
  }

  function onSave() {
    const nextCount = Math.round(Number(count));
    if (!Number.isFinite(nextCount) || nextCount < 1) {
      setError("Las series deben ser un número positivo.");
      return;
    }
    if (nextCount < minSets) {
      setError("No se pueden quitar series ya completadas.");
      return;
    }

    const nextSets = [];
    for (let index = 0; index < nextCount; index += 1) {
      const draft = visibleDrafts[index];
      if (timed) {
        const duration = Number(draft.durationSeconds);
        if (!Number.isFinite(duration) || duration <= 0) {
          setError("La duración debe ser mayor a 0.");
          return;
        }
        nextSets.push({ durationSeconds: Math.round(duration) });
      } else {
        const reps = parseRepsInput(draft.reps);
        if (reps == null) {
          setError("Las repeticiones deben ser un entero de 1 o más.");
          return;
        }
        const weight = parseDraftWeight(draft.weightKg);
        if (!weight.ok) {
          setError("El peso debe ser un número mayor o igual a 0.");
          return;
        }
        nextSets.push({ reps, weightKg: weight.value });
      }
    }

    saveWorkoutExercise(exercise.workoutExerciseId, nextSets);
    onClose();
  }

  return (
    <Modal
      open
      title="Editar series"
      onClose={onClose}
      footer={
        <>
          <Button size="lg" icon={<Check size={18} />} onClick={onSave}>
            Guardar
          </Button>
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <label>
          Cantidad de series
          <input
            type="number"
            inputMode="numeric"
            min={minSets}
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </label>

        {visibleDrafts.map((set, index) => (
          <div key={set.id || index} className={styles.set}>
            <p className={styles.setTitle}>Serie {index + 1}</p>
            {timed ? (
              <label>
                Tiempo (s)
                <input
                  inputMode="numeric"
                  min="1"
                  value={set.durationSeconds}
                  onChange={(event) =>
                    updateDraft(index, "durationSeconds", event.target.value)
                  }
                />
              </label>
            ) : (
              <div className={styles.row}>
                <label>
                  Repeticiones
                  <input
                    inputMode="numeric"
                    min="1"
                    value={set.reps}
                    onChange={(event) => updateDraft(index, "reps", event.target.value)}
                  />
                </label>
                <label>
                  Peso
                  <div className={styles.suffixField}>
                    <input
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      value={set.weightKg}
                      onChange={(event) =>
                        updateDraft(index, "weightKg", event.target.value)
                      }
                    />
                    <span className={styles.suffix}>KG</span>
                  </div>
                </label>
              </div>
            )}
          </div>
        ))}

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button variant="ghost" size="lg" onClick={onReplace}>
          Cambiar ejercicio
        </Button>
      </div>
    </Modal>
  );
}

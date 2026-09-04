"use client";

import { useState } from "react";
import { ListOrdered, Watch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import {
  combineSeconds,
  EXERCISE_TYPE,
  splitSeconds,
} from "@/lib/exercises";
import { createId } from "@/lib/ids";
import { NUMBER_FIELD, TEXT_FIELD } from "@/lib/inputAttrs";
import styles from "./ExerciseEditor.module.css";

function valuesFromExercise(exercise) {
  const duration = splitSeconds(exercise?.defaultDurationSeconds || 60);
  return {
    name: exercise?.name || "",
    type: exercise?.type === EXERCISE_TYPE.TIMED ? EXERCISE_TYPE.TIMED : EXERCISE_TYPE.REPS,
    defaultSets: String(exercise?.defaultSets || 3),
    reps: String(exercise?.defaultReps?.max || exercise?.defaultReps?.min || 10),
    weight: exercise?.defaultWeightKg != null ? String(exercise.defaultWeightKg) : "",
    restSeconds: String(exercise?.restSeconds ?? 90),
    minutes: String(duration.minutes),
    seconds: String(duration.seconds),
  };
}

export function ExerciseEditor({ exercise, asStretch = false, onClose, onCreated }) {
  const { createExercise, updateExercise } = useArnold();
  const [values, setValues] = useState(() =>
    valuesFromExercise(
      exercise ||
        (asStretch
          ? {
              type: EXERCISE_TYPE.TIMED,
              defaultSets: 2,
              defaultDurationSeconds: 90,
              restSeconds: 15,
            }
          : null),
    ),
  );
  const [error, setError] = useState("");

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function onSubmit(event) {
    event.preventDefault();
    const sets = Number(values.defaultSets);
    const restSeconds = Number(values.restSeconds);
    if (!Number.isFinite(sets) || sets < 1) {
      setError("Las series deben ser un número positivo.");
      return;
    }
    if (!Number.isFinite(restSeconds) || restSeconds < 0) {
      setError("El descanso no puede ser negativo.");
      return;
    }

    const type = asStretch ? EXERCISE_TYPE.TIMED : values.type;
    const payload = {
      name: values.name,
      type,
      defaultSets: Math.round(sets),
      restSeconds: Math.round(restSeconds),
    };

    if (type === EXERCISE_TYPE.REPS) {
      const reps = Number(values.reps);
      if (!Number.isFinite(reps) || reps < 1) {
        setError("Las repeticiones deben ser un número positivo.");
        return;
      }
      payload.defaultReps = { min: Math.round(reps), max: Math.round(reps) };
      payload.defaultWeightKg = values.weight;
    } else {
      payload.defaultDurationSeconds = combineSeconds(values.minutes, values.seconds);
      payload.durationRange = {
        min: payload.defaultDurationSeconds,
        max: payload.defaultDurationSeconds,
      };
    }

    if (asStretch && !exercise) {
      payload.id = `ex-elong-${createId()}`;
    }

    const result = exercise
      ? updateExercise(exercise.id, payload)
      : createExercise(
          payload,
          asStretch ? { notice: "Elongación creada" } : undefined,
        );

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (!exercise && result.exercise) {
      onCreated?.(result.exercise);
    }
    onClose();
  }

  return (
    <Modal
      open
      title={
        exercise ? "Editar ejercicio" : asStretch ? "Nueva elongación" : "Nuevo ejercicio"
      }
      onClose={onClose}
      footer={
        <Button type="submit" size="lg" form="exercise-form">
          Guardar
        </Button>
      }
    >
      <form id="exercise-form" className={styles.form} autoComplete="off" onSubmit={onSubmit}>
        <label>
          Nombre
          <input
            {...TEXT_FIELD}
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            required
            maxLength={80}
            placeholder={
              asStretch ? "Elongación de pecho" : "Press banca plana con barra olímpica"
            }
          />
        </label>

        {asStretch ? null : (
          <div>
            <p className="sr-only">Tipo de ejercicio</p>
            <div className={styles.types}>
              <button
                type="button"
                className={styles.type}
                aria-pressed={values.type === EXERCISE_TYPE.REPS}
                onClick={() => update("type", EXERCISE_TYPE.REPS)}
              >
                <ListOrdered size={22} />
                Series y repeticiones
              </button>
              <button
                type="button"
                className={styles.type}
                aria-pressed={values.type === EXERCISE_TYPE.TIMED}
                onClick={() => update("type", EXERCISE_TYPE.TIMED)}
              >
                <Watch size={22} />
                Series por tiempo
              </button>
            </div>
          </div>
        )}

        {values.type === EXERCISE_TYPE.REPS && !asStretch ? (
          <>
            <div className={styles.row3}>
              <label>
                Series
                <input
                  {...NUMBER_FIELD}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={values.defaultSets}
                  onChange={(event) => update("defaultSets", event.target.value)}
                />
              </label>
              <label>
                Repeticiones
                <input
                  {...NUMBER_FIELD}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={values.reps}
                  onChange={(event) => update("reps", event.target.value)}
                />
              </label>
              <label>
                Descanso
                <div className={styles.suffixField}>
                  <input
                    {...NUMBER_FIELD}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={values.restSeconds}
                    onChange={(event) => update("restSeconds", event.target.value)}
                  />
                  <span className={styles.suffix}>s</span>
                </div>
              </label>
            </div>
            <label>
              Peso inicial
              <div className={styles.suffixField}>
                <input
                  {...NUMBER_FIELD}
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={values.weight}
                  onChange={(event) => update("weight", event.target.value)}
                  placeholder="40"
                />
                <span className={styles.suffix}>KG</span>
              </div>
            </label>
          </>
        ) : (
          <>
            <div className={styles.row}>
              <label>
                Series
                <input
                  {...NUMBER_FIELD}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={values.defaultSets}
                  onChange={(event) => update("defaultSets", event.target.value)}
                />
              </label>
              <label>
                Descanso entre series
                <div className={styles.suffixField}>
                  <input
                    {...NUMBER_FIELD}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={values.restSeconds}
                    onChange={(event) => update("restSeconds", event.target.value)}
                  />
                  <span className={styles.suffix}>s</span>
                </div>
              </label>
            </div>
            <div className={styles.row}>
              <label>
                Minutos
                <input
                  {...NUMBER_FIELD}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={values.minutes}
                  onChange={(event) => update("minutes", event.target.value)}
                />
              </label>
              <label>
                Segundos
                <input
                  {...NUMBER_FIELD}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  value={values.seconds}
                  onChange={(event) => update("seconds", event.target.value)}
                />
              </label>
            </div>
          </>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
      </form>
    </Modal>
  );
}
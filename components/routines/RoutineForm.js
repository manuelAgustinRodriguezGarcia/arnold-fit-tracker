"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ExerciseSelector } from "@/components/routines/ExerciseSelector";
import { ExerciseEditor } from "@/components/routines/ExerciseEditor";
import { useArnold } from "@/hooks/useArnold";
import { createId } from "@/lib/ids";
import { findExerciseById, formatExerciseSummary, resolveRoutineExercises } from "@/lib/exercises";
import styles from "./RoutineForm.module.css";

gsap.registerPlugin(useGSAP, Flip);

function entriesFromRoutine(routine, library) {
  if (!routine?.exercises?.length) {
    return [];
  }
  return resolveRoutineExercises(routine, library).map((exercise) => ({
    id: createId(),
    exerciseId: exercise.exerciseId || exercise.id,
  }));
}

export function RoutineForm({ routine, onClose }) {
  const { createRoutine, updateRoutine, exercises } = useArnold();
  const [name, setName] = useState(routine?.name || "");
  const [description, setDescription] = useState(routine?.description || "");
  const [entries, setEntries] = useState(() => entriesFromRoutine(routine, exercises));
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);
  const listRef = useRef(null);
  useGSAP({ scope: listRef });

  function moveExercise(index, direction) {
    const list = listRef.current;
    const nextIndex = index + direction;
    if (!list || nextIndex < 0 || nextIndex >= list.children.length) {
      return;
    }

    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const state = animate ? Flip.getState(list.children) : null;

    if (animate) {
      setReordering(true);
    }

    flushSync(() => {
      setEntries((current) => {
        const next = [...current];
        const [item] = next.splice(index, 1);
        next.splice(nextIndex, 0, item);
        return next;
      });
    });

    if (!state) {
      return;
    }

    const previousMinHeight = list.style.minHeight;
    list.style.minHeight = `${list.getBoundingClientRect().height}px`;

    Flip.from(state, {
      duration: 0.28,
      ease: "power2.inOut",
      absolute: true,
      simple: true,
      scale: false,
      onComplete: () => {
        list.style.minHeight = previousMinHeight;
        setReordering(false);
      },
    });
  }

  function removeExercise(id) {
    setEntries((current) => current.filter((item) => item.id !== id));
  }

  function onSubmit(event) {
    event.preventDefault();
    const payload = {
      name,
      description,
      exercises: entries.map((item) => ({ exerciseId: item.exerciseId })),
    };
    const result = routine
      ? updateRoutine(routine.id, payload)
      : createRoutine(payload);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onClose();
  }

  return (
    <>
      <Modal
        open
        title={routine ? "Editar rutina" : "Crear rutina"}
        onClose={onClose}
        footer={
          <Button type="submit" size="lg" form="routine-form">
            Guardar
          </Button>
        }
      >
        <form id="routine-form" className={styles.form} onSubmit={onSubmit}>
          <label>
            Nombre
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              placeholder="Pecho + tríceps"
            />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={180}
              placeholder="Pecho y tríceps"
            />
          </label>

          <div className={styles.exercisesHeader}>
            <h3>Ejercicios</h3>
            <Button
              variant="secondary"
              icon={<Plus size={16} />}
              onClick={() => setSelectorOpen(true)}
            >
              Agregar ejercicio
            </Button>
          </div>

          {entries.length === 0 ? (
            <p className={styles.empty}>Elegí ejercicios de la biblioteca.</p>
          ) : (
            <ul ref={listRef} className={styles.exercises}>
              {entries.map((entry, index) => {
                const exercise = findExerciseById(exercises, entry.exerciseId);
                return (
                  <li key={entry.id} className={styles.exercise}>
                    <div>
                      <strong>{exercise?.name || "Ejercicio"}</strong>
                      {exercise ? <span>{formatExerciseSummary(exercise)}</span> : null}
                    </div>
                    <div className={styles.rowActions}>
                      <IconButton
                        label="Mover hacia arriba"
                        onClick={() => moveExercise(index, -1)}
                        disabled={reordering || index === 0}
                      >
                        <ArrowUp size={18} />
                      </IconButton>
                      <IconButton
                        label="Mover hacia abajo"
                        onClick={() => moveExercise(index, 1)}
                        disabled={reordering || index === entries.length - 1}
                      >
                        <ArrowDown size={18} />
                      </IconButton>
                      <IconButton
                        label="Quitar ejercicio de la rutina"
                        onClick={() => removeExercise(entry.id)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {error ? <p className={styles.error}>{error}</p> : null}
        </form>
      </Modal>

      <ExerciseSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onCreate={() => setCreatorOpen(true)}
        onSelect={(exercise) => {
          setEntries((current) => [
            ...current,
            { id: createId(), exerciseId: exercise.id },
          ]);
        }}
      />
      {creatorOpen ? (
        <ExerciseEditor
          onClose={() => setCreatorOpen(false)}
          onCreated={(exercise) => {
            setEntries((current) => [
              ...current,
              { id: createId(), exerciseId: exercise.id },
            ]);
            setCreatorOpen(false);
            setSelectorOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
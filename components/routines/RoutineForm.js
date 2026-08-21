"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import { createId } from "@/lib/ids";
import styles from "./RoutineForm.module.css";

gsap.registerPlugin(useGSAP, Flip);

function emptyExercise() {
  return {
    id: createId(),
    name: "",
    details: "",
    imagePath: "",
  };
}

function exercisesFromRoutine(routine) {
  if (routine?.exercises?.length) {
    return routine.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name || "",
      details: exercise.details || "",
      imagePath: exercise.imagePath || "",
    }));
  }
  return [emptyExercise()];
}

export function RoutineForm({ routine, onClose }) {
  const { createRoutine, updateRoutine } = useArnold();
  const [name, setName] = useState(routine?.name || "");
  const [description, setDescription] = useState(routine?.description || "");
  const [exercises, setExercises] = useState(() => exercisesFromRoutine(routine));
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);
  const listRef = useRef(null);
  const { contextSafe } = useGSAP({ scope: listRef });

  function updateExercise(id, field, value) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise,
      ),
    );
  }

  const moveExercise = contextSafe((index, direction) => {
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
      setExercises((current) => {
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
  });

  function removeExercise(id) {
    setExercises((current) =>
      current.length === 1
        ? [emptyExercise()]
        : current.filter((exercise) => exercise.id !== id),
    );
  }

  function onSubmit(event) {
    event.preventDefault();
    const payload = { name, description, exercises };
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
            onClick={() => setExercises((current) => [...current, emptyExercise()])}
          >
            Agregar
          </Button>
        </div>

        <ul ref={listRef} className={styles.exercises}>
          {exercises.map((exercise, index) => (
            <li key={exercise.id} className={styles.exercise}>
              <label>
                Nombre del ejercicio
                <input
                  value={exercise.name}
                  onChange={(event) =>
                    updateExercise(exercise.id, "name", event.target.value)
                  }
                  placeholder="Press banca"
                />
              </label>
              <label>
                Detalle
                <input
                  value={exercise.details}
                  onChange={(event) =>
                    updateExercise(exercise.id, "details", event.target.value)
                  }
                  placeholder="3 x 10-12"
                />
              </label>
              <label>
                Imagen
                <input
                  value={exercise.imagePath}
                  onChange={(event) =>
                    updateExercise(exercise.id, "imagePath", event.target.value)
                  }
                  placeholder="/exercises/bench-press.webp"
                />
              </label>
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
                  disabled={reordering || index === exercises.length - 1}
                >
                  <ArrowDown size={18} />
                </IconButton>
                <IconButton
                  label="Eliminar ejercicio"
                  onClick={() => removeExercise(exercise.id)}
                >
                  <Trash2 size={18} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
        {error ? <p className={styles.error}>{error}</p> : null}
      </form>
    </Modal>
  );
}

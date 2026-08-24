"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import {
  formatExerciseSummary,
  formatExerciseType,
  normalizeName,
} from "@/lib/exercises";
import styles from "./ExerciseSelector.module.css";

export function ExerciseSelector({
  open,
  title = "Agregar ejercicio",
  onClose,
  onSelect,
  onCreate,
}) {
  const { exercises } = useArnold();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const key = normalizeName(query);
    const list = [...exercises].sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!key) {
      return list;
    }
    return list.filter((exercise) => normalizeName(exercise.name).includes(key));
  }, [exercises, query]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <label className={styles.search}>
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar ejercicio</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar ejercicio..."
        />
      </label>

      {onCreate ? (
        <button type="button" className={styles.create} onClick={onCreate}>
          <Plus size={18} />
          Crear nuevo ejercicio
        </button>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="No hay ejercicios para mostrar" />
      ) : (
        <ul className={styles.list}>
          {filtered.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                className={styles.item}
                onClick={() => {
                  onSelect(exercise);
                  onClose();
                }}
              >
                <strong>{exercise.name}</strong>
                <span>
                  {formatExerciseType(exercise.type)} · {formatExerciseSummary(exercise)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

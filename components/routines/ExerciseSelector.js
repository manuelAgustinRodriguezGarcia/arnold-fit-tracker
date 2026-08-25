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
import { SEARCH_FIELD } from "@/lib/inputAttrs";
import styles from "./ExerciseSelector.module.css";

export function ExerciseSelector({
  open,
  title = "Agregar ejercicio",
  excludeIds = [],
  onClose,
  onSelect,
  onCreate,
}) {
  const { exercises } = useArnold();
  const [query, setQuery] = useState("");

  const excluded = useMemo(() => new Set(excludeIds.filter(Boolean)), [excludeIds]);

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
      <form className={styles.form} autoComplete="off" onSubmit={(event) => event.preventDefault()}>
      <label className={styles.search}>
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar ejercicio</span>
        <input
          {...SEARCH_FIELD}
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
          {filtered.map((exercise) => {
            const added = excluded.has(exercise.id);
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  className={styles.item}
                  disabled={added}
                  onClick={() => {
                    if (added) {
                      return;
                    }
                    onSelect(exercise);
                    onClose();
                  }}
                >
                  <strong>{exercise.name}</strong>
                  <span>
                    {added
                      ? "Ya está en la lista"
                      : `${formatExerciseType(exercise.type)} · ${formatExerciseSummary(exercise)}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      </form>
    </Modal>
  );
}

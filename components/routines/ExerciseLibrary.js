"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/Button";
import { useArnold } from "@/hooks/useArnold";
import { formatExerciseSummary, formatExerciseType } from "@/lib/exercises";
import styles from "./ExerciseLibrary.module.css";

export function ExerciseLibrary({ onCreate, onEdit, onDelete }) {
  const { exercises } = useArnold();
  const ordered = [...exercises].sort((a, b) => a.name.localeCompare(b.name, "es"));

  if (ordered.length === 0) {
    return (
      <EmptyState
        title="Todavía no creaste ejercicios."
        actionLabel="Crear ejercicio"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className={styles.list}>
      {ordered.map((exercise) => (
        <Card key={exercise.id} className={styles.card}>
          <div className={styles.copy}>
            <h3>{exercise.name}</h3>
            <div className={styles.meta}>
              <span>{formatExerciseType(exercise.type)}</span>
              <span>{formatExerciseSummary(exercise)}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <IconButton label="Editar ejercicio" onClick={() => onEdit(exercise)}>
              <Pencil size={18} />
            </IconButton>
            <IconButton label="Eliminar ejercicio" onClick={() => onDelete(exercise)}>
              <Trash2 size={18} />
            </IconButton>
          </div>
        </Card>
      ))}
    </div>
  );
}
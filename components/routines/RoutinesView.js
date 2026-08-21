"use client";

import { Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { useArnold } from "@/hooks/useArnold";
import styles from "./RoutinesView.module.css";

export function RoutinesView({ onCreate, onEdit, onDelete, onStart }) {
  const { routines } = useArnold();

  return (
    <>
      <section className={styles.view}>
        {routines.length === 0 ? (
          <EmptyState title="Todavía no tenés rutinas" />
        ) : (
          <div className={styles.list}>
            {routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onStart={() => onStart(routine.id)}
                onEdit={() => onEdit(routine)}
                onDelete={() => onDelete(routine)}
              />
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        className={styles.fab}
        aria-label="Crear rutina"
        onClick={onCreate}
      >
        <Plus size={26} strokeWidth={2.4} />
      </button>
    </>
  );
}

"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import styles from "./StartWorkoutPicker.module.css";

export function StartWorkoutPicker({ open, onClose, onSelect, onCreate }) {
  const { routines } = useArnold();

  return (
    <Modal open={open} title="Comenzar entrenamiento" onClose={onClose}>
      {routines.length === 0 ? (
        <EmptyState
          title="Todavía no tenés rutinas"
          actionLabel="Crear rutina"
          onAction={onCreate}
        />
      ) : (
        <ul className={styles.list}>
          {routines.map((routine) => (
            <li key={routine.id}>
              <div>
                <strong>{routine.name}</strong>
                <span>
                  {(routine.exercises?.length || 0)} ejercicios
                </span>
              </div>
              <Button
                icon={<Play size={16} />}
                onClick={() => onSelect(routine.id)}
              >
                Comenzar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

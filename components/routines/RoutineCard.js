import { Pencil, Play, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import styles from "./RoutineCard.module.css";

export function RoutineCard({ routine, onStart, onEdit, onDelete }) {
  const count = routine.exercises?.length || 0;

  return (
    <Card className={styles.card}>
      <div className={styles.copy}>
        <h3>{routine.name}</h3>
        {routine.description ? <p>{routine.description}</p> : null}
        <span>
          {count} {count === 1 ? "ejercicio" : "ejercicios"}
        </span>
      </div>
      <div className={styles.actions}>
        <Button icon={<Play size={18} />} onClick={onStart}>
          Comenzar
        </Button>
        <IconButton label="Editar rutina" onClick={onEdit}>
          <Pencil size={18} />
        </IconButton>
        <IconButton label="Eliminar rutina" onClick={onDelete}>
          <Trash2 size={18} />
        </IconButton>
      </div>
    </Card>
  );
}

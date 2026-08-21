import { ExerciseImage } from "@/components/ui/ExerciseImage";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  formatDateTime,
  formatDurationHuman,
  getTrainingTitle,
} from "@/lib/dates";
import { getFatigueLabel } from "@/lib/workout";
import styles from "./SessionDetail.module.css";

export function SessionDetail({ session, onClose, onDelete }) {
  if (!session) {
    return null;
  }

  const exercises = session.routineSnapshot?.exercises || [];

  return (
    <Modal
      open={Boolean(session)}
      title={getTrainingTitle(session.startedAt)}
      onClose={onClose}
      footer={
        <Button variant="danger" size="lg" onClick={() => onDelete(session)}>
          Eliminar entrenamiento
        </Button>
      }
    >
      <dl className={styles.meta}>
        <div>
          <dt>Rutina</dt>
          <dd>{session.routineName}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{formatDurationHuman(session.durationSeconds)}</dd>
        </div>
        <div>
          <dt>Inicio</dt>
          <dd>{formatDateTime(session.startedAt)}</dd>
        </div>
        <div>
          <dt>Finalización</dt>
          <dd>{formatDateTime(session.endedAt)}</dd>
        </div>
        <div>
          <dt>Ejercicios</dt>
          <dd>{session.exerciseCount}</dd>
        </div>
        <div>
          <dt>Cansancio</dt>
          <dd>{getFatigueLabel(session.fatigue)}</dd>
        </div>
      </dl>

      <section>
        <h3 className={styles.listTitle}>Ejercicios de ese día</h3>
        <ul className={styles.exercises}>
          {exercises.map((exercise) => (
            <li key={exercise.id || exercise.name}>
              <ExerciseImage
                imagePath={exercise.imagePath}
                name={exercise.name}
              />
              <div>
                <strong>{exercise.name}</strong>
                {exercise.details ? <span>{exercise.details}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Modal>
  );
}

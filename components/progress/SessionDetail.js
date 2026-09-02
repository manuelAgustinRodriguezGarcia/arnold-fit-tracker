import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
import { ExerciseImage } from "@/components/ui/ExerciseImage";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  formatDate,
  formatDurationHuman,
  formatTime,
  getTrainingTitle,
} from "@/lib/dates";
import { EXERCISE_TYPE, formatSeconds } from "@/lib/exercises";
import { formatWaterMl } from "@/lib/hydration";
import { FATIGUE, getFatigueLabel, getSessionExercises } from "@/lib/workout";
import styles from "./SessionDetail.module.css";

function FatigueIcon({ value }) {
  let Icon = null;

  switch (value) {
    case FATIGUE.VERY_TIRED:
      Icon = BatteryLow;
      break;
    case FATIGUE.TIRED:
      Icon = BatteryMedium;
      break;
    case FATIGUE.REGULAR:
      Icon = BatteryFull;
      break;
    default:
      Icon = null;
      break;
  }

  if (!Icon) {
    return null;
  }

  return <Icon size={18} aria-hidden="true" />;
}

function formatSetLine(exercise, set) {
  if (exercise.type === EXERCISE_TYPE.TIMED) {
    return `${formatSeconds(set.durationSeconds)}`;
  }
  const reps = set.reps != null ? `${set.reps} reps` : "— reps";
  const weight = set.weightKg != null ? `${set.weightKg} KG` : "— KG";
  return `${reps} · ${weight}`;
}

function getSetKey(exercise, set) {
  if (exercise.type === EXERCISE_TYPE.TIMED) {
    return String(set.durationSeconds ?? "");
  }
  return `${set.reps ?? ""}|${set.weightKg ?? ""}`;
}

function setsMatch(exercise, sets) {
  if (sets.length < 2) {
    return true;
  }
  const first = getSetKey(exercise, sets[0]);
  return sets.every((set) => getSetKey(exercise, set) === first);
}

function formatSetSummaries(exercise) {
  const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
  if (sets.length === 0) {
    return [];
  }
  if (setsMatch(exercise, sets)) {
    const count = sets.length;
    const label = count === 1 ? "1 serie" : `${count} series`;
    return [`${label} · ${formatSetLine(exercise, sets[0])}`];
  }
  return sets.map((set) => `Serie ${set.number} · ${formatSetLine(exercise, set)}`);
}

export function SessionDetail({ session, onClose, onDelete }) {
  if (!session) {
    return null;
  }

  const exercises = getSessionExercises(session);

  return (
    <Modal
      open={Boolean(session)}
      title={getTrainingTitle(session.startedAt)}
      titleMeta={formatDate(session.startedAt)}
      headerVariant="bronze"
      onClose={onClose}
      footer={
        <Button variant="danger" size="lg" onClick={() => onDelete(session)}>
          Eliminar entrenamiento
        </Button>
      }
    >
      <dl className={styles.meta}>
        <div className={styles.row}>
          <div>
            <dt>Inicio</dt>
            <dd>{formatTime(session.startedAt)}</dd>
          </div>
          <div>
            <dt>Finalización</dt>
            <dd>{formatTime(session.endedAt)}</dd>
          </div>
        </div>
        <div className={styles.row}>
          <div>
            <dt>Rutina</dt>
            <dd>{session.routineName}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{formatDurationHuman(session.durationSeconds)}</dd>
          </div>
        </div>
        <div className={styles.row}>
          <div>
            <dt>Ejercicios</dt>
            <dd>{session.exerciseCount}</dd>
          </div>
          <div>
            <dt>Cansancio</dt>
            <dd className={styles.fatigue}>
              <FatigueIcon value={session.fatigue} />
              {getFatigueLabel(session.fatigue)}
            </dd>
          </div>
        </div>
        {session.waterMl != null ? (
          <div className={styles.row}>
            <div>
              <dt>Agua</dt>
              <dd>{formatWaterMl(session.waterMl)}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      <section>
        <h3 className={styles.listTitle}>Ejercicios de ese día</h3>
        <ul className={styles.exercises}>
          {exercises.map((exercise) => {
            const summaries = formatSetSummaries(exercise);
            return (
              <li key={exercise.workoutExerciseId || exercise.id || exercise.name}>
                <ExerciseImage
                  imagePath={exercise.imagePath}
                  name={exercise.name}
                />
                <div>
                  <strong>{exercise.name}</strong>
                  {summaries.length > 0 ? (
                    <div className={styles.sets}>
                      {summaries.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </div>
                  ) : exercise.details ? (
                    <span>{exercise.details}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </Modal>
  );
}

import { BatteryFull, BatteryLow, BatteryMedium, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatDate,
  formatDurationHuman,
  formatTime,
  getTrainingTitle,
} from "@/lib/dates";
import { FATIGUE, getFatigueLabel } from "@/lib/workout";
import styles from "./SessionCard.module.css";

function FatigueIcon({ value }) {
  const label = getFatigueLabel(value);
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

  return (
    <span className={styles.fatigue} aria-label={label} title={label}>
      <Icon size={22} aria-hidden="true" />
    </span>
  );
}

export function SessionCard({ session, onOpen, onDelete }) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <button type="button" className={styles.open} onClick={onOpen}>
          <h3>{getTrainingTitle(session.startedAt)}</h3>
        </button>
        <div className={styles.aside}>
          <FatigueIcon value={session.fatigue} />
          <IconButton label="Eliminar entrenamiento" onClick={onDelete}>
            <Trash2 size={18} />
          </IconButton>
        </div>
      </div>
      <button type="button" className={styles.open} onClick={onOpen}>
        <p>{session.routineName}</p>
        <dl>
          <div>
            <dt>Fecha</dt>
            <dd>{formatDate(session.startedAt)}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{formatTime(session.startedAt)}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{formatDurationHuman(session.durationSeconds)}</dd>
          </div>
        </dl>
      </button>
    </Card>
  );
}

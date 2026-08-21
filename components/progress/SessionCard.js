import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
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

export function SessionCard({ session, onOpen }) {
  return (
    <Card as="button" className={styles.card} onClick={onOpen}>
      <div className={styles.header}>
        <h3>{getTrainingTitle(session.startedAt)}</h3>
        <FatigueIcon value={session.fatigue} />
      </div>
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
    </Card>
  );
}

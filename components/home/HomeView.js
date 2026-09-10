"use client";

import { useState } from "react";
import { ChartNoAxesColumnIncreasing, Dumbbell, Plus, Settings } from "lucide-react";
import { InstallPWA } from "@/components/install/InstallPWA";
import { ActiveWorkoutCard } from "@/components/home/ActiveWorkoutCard";
import { useArnold } from "@/hooks/useArnold";
import {
  formatDurationHuman,
  getPeriodRange,
  getWeekdayName,
  getWeekdayShortLabels,
} from "@/lib/dates";
import { getActivityByDay, getPeriodSessions } from "@/lib/exerciseStats";
import styles from "./HomeView.module.css";

const WEEKDAY_LABELS = getWeekdayShortLabels();

function barDurationParts(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const parts = [];
  if (hours > 0) {
    parts.push({ unit: "h", value: String(hours) });
  }
  if (minutes > 0) {
    parts.push({ unit: "min", value: String(minutes) });
  } else if (hours === 0) {
    parts.push({ unit: "s", value: String(total) });
  }
  return parts;
}

export function HomeView({
  onCreateRoutine,
  onStartWorkout,
  onContinueWorkout,
  onOpenSettings,
}) {
  const { routines, sessions, activeWorkout } = useArnold();

  return (
    <section className={styles.view}>
      <InstallPWA />

      <div className={styles.actions}>
        <button type="button" className={styles.tile} onClick={onCreateRoutine}>
          <Plus size={32} />
          <span className={styles.tileLabel}>Rutina</span>
        </button>
        <button type="button" className={styles.tile} onClick={onOpenSettings}>
          <Settings size={32} />
          <span className={styles.tileLabel}>Ajustes</span>
        </button>
      </div>

      {!activeWorkout ? (
        <button
          type="button"
          className={`${styles.tile} ${styles.tilePrimary}`}
          onClick={onStartWorkout}
          disabled={routines.length === 0}
        >
          <Dumbbell size={32} />
          <span className={styles.tileLabel}>ENTRENAR</span>
        </button>
      ) : null}

      <WeeklySummary sessions={sessions} />

      {activeWorkout ? (
        <ActiveWorkoutCard
          workout={activeWorkout}
          onContinue={onContinueWorkout}
        />
      ) : null}
    </section>
  );
}

function WeeklySummary({ sessions }) {
  const range = getPeriodRange("week", 0);
  const days = getActivityByDay(getPeriodSessions(sessions, "week", 0), range);
  const max = Math.max(0, ...days.map((day) => day.durationSeconds));
  const [openKey, setOpenKey] = useState(null);

  function onBarClick(day) {
    const key = day.date.getTime();
    if (day.durationSeconds <= 0) {
      setOpenKey(null);
      return;
    }
    setOpenKey((current) => (current === key ? null : key));
  }

  return (
    <section className={styles.week} aria-label="Actividad de esta semana">
      <div className={styles.weekHeader}>
        <ChartNoAxesColumnIncreasing size={18} />
        <h2>Esta semana</h2>
      </div>
      <div className={styles.bars} role="list">
        {days.map((day, index) => {
          const key = day.date.getTime();
          const trained = day.durationSeconds > 0;
          const open = openKey === key;
          const height = max && trained ? Math.max(8, (day.durationSeconds / max) * 100) : 0;
          const name = getWeekdayName(day.date);
          const routines = day.routineNames || [];
          return (
            <button
              key={key}
              type="button"
              className={styles.barCol}
              role="listitem"
              aria-expanded={trained ? open : undefined}
              aria-label={
                trained
                  ? `${name}, ${formatDurationHuman(day.durationSeconds)}${
                      routines.length ? `, ${routines.join(", ")}` : ""
                    }`
                  : `${name}, sin entrenamiento`
              }
              onClick={() => onBarClick(day)}
            >
              <span
                className={`${styles.barTip} ${open ? styles.barTipOpen : ""}`}
                aria-hidden={!open}
              >
                {routines.map((routine) => (
                  <span key={routine} className={styles.barTipLine}>
                    {routine}
                  </span>
                ))}
              </span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ height: `${height}%` }}>
                  {trained ? (
                    <span className={styles.barTime} aria-hidden="true">
                      {barDurationParts(day.durationSeconds).map((part) => (
                        <span key={part.unit} className={styles.barTimePart}>
                          <span className={styles.barNum}>{part.value}</span>
                          {part.unit}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className={styles.barLabel} aria-hidden="true">
                {WEEKDAY_LABELS[index]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

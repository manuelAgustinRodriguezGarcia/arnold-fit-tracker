"use client";

import { useState } from "react";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import {
  formatDurationHuman,
  getWeekdayName,
  getWeekdayShortLabels,
} from "@/lib/dates";
import styles from "./WeekActivityBars.module.css";

const WEEKDAY_LABELS = getWeekdayShortLabels();

function sessionTime(session) {
  return new Date(session.endedAt || session.startedAt).getTime();
}

function sessionRoutineName(session) {
  return session.routineName || session.routineSnapshot?.name || "Entrenamiento";
}

function getLatestSession(list) {
  if (!list?.length) {
    return null;
  }
  return list.reduce((latest, session) =>
    !latest || sessionTime(session) > sessionTime(latest) ? session : latest,
  );
}

export function WeekActivityBars({
  sessions,
  days,
  title = "Actividad",
  ariaLabel = "Actividad de esta semana",
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const latestOverall = getLatestSession(sessions);

  function sessionsForDay(day) {
    const dayStart = day.date.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
    return (sessions || []).filter((session) => {
      const time = sessionTime(session);
      return time >= dayStart && time <= dayEnd;
    });
  }

  function onBarClick(day) {
    const key = day.date.getTime();
    if (day.durationSeconds <= 0) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey((current) => (current === key ? null : key));
  }

  const selectedDay = days.find((day) => day.date.getTime() === selectedKey);
  const selectedSession = selectedDay ? getLatestSession(sessionsForDay(selectedDay)) : null;
  const captionSession = selectedSession || latestOverall;
  const captionText = captionSession
    ? selectedSession
      ? `${getWeekdayName(selectedDay.date)}: ${sessionRoutineName(selectedSession)} - ${formatDurationHuman(selectedSession.durationSeconds)}`
      : `Último: ${sessionRoutineName(latestOverall)} - ${formatDurationHuman(latestOverall.durationSeconds)}`
    : null;

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      <div className={styles.header}>
        <ChartNoAxesColumnIncreasing size={18} />
        <h2>{title}</h2>
      </div>
      <div className={styles.bars} role="list">
        {days.map((day, index) => {
          const key = day.date.getTime();
          const trained = day.durationSeconds > 0;
          const selected = selectedKey === key;
          const name = getWeekdayName(day.date);
          const routines = day.routineNames || [];
          return (
            <button
              key={key}
              type="button"
              className={`${styles.barCol}${selected ? ` ${styles.barColSelected}` : ""}`}
              role="listitem"
              aria-pressed={trained ? selected : undefined}
              aria-label={
                trained
                  ? `${name}, ${formatDurationHuman(day.durationSeconds)}${
                      routines.length ? `, ${routines.join(", ")}` : ""
                    }`
                  : `${name}, sin entrenamiento`
              }
              onClick={() => onBarClick(day)}
            >
              <span className={styles.barTrack}>
                {trained ? <span className={styles.barFill} /> : null}
                <span className={styles.barLabel} aria-hidden="true">
                  {WEEKDAY_LABELS[index]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {captionText ? (
        <p key={captionText} className={styles.caption} aria-live="polite">
          {captionText}
        </p>
      ) : null}
    </section>
  );
}

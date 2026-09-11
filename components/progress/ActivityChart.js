"use client";

import { WeekActivityBars } from "@/components/progress/WeekActivityBars";
import styles from "./ProgressCharts.module.css";

export function ActivityChart({ period, days, weeks, sessions }) {
  if (period === "week") {
    return (
      <WeekActivityBars
        sessions={sessions}
        days={days}
        title="Actividad"
        ariaLabel="Actividad del período"
      />
    );
  }

  const items = weeks;
  const max = Math.max(0, ...items.map((item) => item.durationSeconds));

  return (
    <section className={styles.section} aria-label="Actividad del período">
      <h3>Actividad</h3>
      <div className={styles.bars}>
        {items.map((item) => (
          <div key={item.label} className={styles.barCol}>
            <div className={styles.barTrack}>
              <div
                className={`${styles.bar} ${item.durationSeconds > 0 ? styles.barActive : ""}`}
                style={{
                  height: `${max ? Math.max(8, (item.durationSeconds / max) * 100) : 8}%`,
                }}
              />
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

import { formatDurationShort } from "@/lib/dates";
import styles from "./ProgressCharts.module.css";

export function TimeByRoutineChart({ items }) {
  const max = Math.max(0, ...items.map((item) => item.durationSeconds));

  return (
    <section className={styles.section} aria-label="Tiempo por rutina">
      <h3>Tiempo por rutina</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>Sin entrenamientos en este período.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className={styles.row}>
            <span className={styles.name}>{item.name}</span>
            <strong>{formatDurationShort(item.durationSeconds)}</strong>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{ width: `${max ? (item.durationSeconds / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))
      )}
    </section>
  );
}
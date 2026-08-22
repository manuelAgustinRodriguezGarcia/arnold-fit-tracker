"use client";

import styles from "./SetButtons.module.css";

export function SetButtons({ sets, onToggle }) {
  return (
    <div className={styles.sets}>
      {(sets || []).map((set) => (
        <button
          key={set.id}
          type="button"
          className={styles.set}
          aria-pressed={set.completed}
          aria-label={
            set.completed
              ? `Serie ${set.number} completada`
              : `Completar serie ${set.number}`
          }
          onClick={() => onToggle(set)}
        >
          {set.number}
        </button>
      ))}
    </div>
  );
}
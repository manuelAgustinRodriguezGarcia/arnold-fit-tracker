"use client";

import styles from "./SetButtons.module.css";

const ROMAN_MAP = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function toRoman(value) {
  let remaining = Number(value);
  if (!Number.isFinite(remaining) || remaining < 1) return String(value);

  let result = "";
  for (const [amount, numeral] of ROMAN_MAP) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

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
          {toRoman(set.number)}
        </button>
      ))}
    </div>
  );
}
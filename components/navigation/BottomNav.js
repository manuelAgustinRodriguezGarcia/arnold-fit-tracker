"use client";

import { ChartNoAxesColumnIncreasing, Dumbbell, House } from "lucide-react";
import styles from "./BottomNav.module.css";

export const NAV_VIEWS = ["home", "routines", "progress"];

const ITEMS = [
  { id: "home", label: "Inicio", Icon: House },
  { id: "routines", label: "Rutinas", Icon: Dumbbell },
  { id: "progress", label: "Progreso", Icon: ChartNoAxesColumnIncreasing },
];

export function BottomNav({ view, onChange }) {
  return (
    <nav className={styles.nav} aria-label="Principal">
      {ITEMS.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.item} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            <item.Icon size={22} strokeWidth={2.2} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

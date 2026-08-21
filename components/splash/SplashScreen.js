"use client";

import { Logo } from "@/components/ui/Logo";
import styles from "./SplashScreen.module.css";

export function SplashScreen({ visible, leaveNavSpace = false }) {
  return (
    <div
      className={`${styles.splash} ${visible ? styles.visible : ""} ${leaveNavSpace ? styles.withNav : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={visible}
      aria-hidden={!visible}
    >
      <div className={styles.mark}>
        <Logo variant="loading" height={200} />
      </div>
      <span className="sr-only">Cargando Arnold</span>
    </div>
  );
}

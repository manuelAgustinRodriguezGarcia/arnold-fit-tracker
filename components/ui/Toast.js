"use client";

import { useEffect } from "react";
import { Check, CircleAlert } from "lucide-react";
import styles from "./Toast.module.css";

export function Toast({ notice, onClear }) {
  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(onClear, 2400);
    return () => window.clearTimeout(timeout);
  }, [notice, onClear]);

  if (!notice) {
    return null;
  }

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {notice.tone === "error" ? <CircleAlert size={16} /> : <Check size={16} />}
      {notice.message}
    </div>
  );
}

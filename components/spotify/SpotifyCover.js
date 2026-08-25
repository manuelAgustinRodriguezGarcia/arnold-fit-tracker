"use client";

import { Music } from "lucide-react";
import { useState } from "react";
import styles from "./SpotifyCover.module.css";

export function SpotifyCover({ src, alt, size = "sm" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div className={`${styles.cover} ${styles[size]}`} aria-hidden={alt ? undefined : true}>
      {showImage ? (
        <img src={src} alt={alt || ""} onError={() => setFailedSrc(src)} />
      ) : (
        <span className={styles.fallback}>
          <Music size={size === "lg" ? 36 : 18} strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}

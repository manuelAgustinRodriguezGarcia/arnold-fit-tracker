"use client";

import { useState } from "react";
import { Check, Dumbbell } from "lucide-react";
import styles from "./ExerciseImage.module.css";

export function ExerciseImage({ imagePath, name, size = 48, done = false }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imagePath) && !failed && !done;

  return (
    <div
      className={`${styles.frame} ${done ? styles.done : ""}`}
      style={{ width: size, height: size }}
      aria-hidden={showImage ? undefined : true}
    >
      {done ? (
        <Check size={22} strokeWidth={2.4} />
      ) : showImage ? (
        <img
          src={imagePath}
          alt={name}
          width={size}
          height={size}
          onError={() => setFailed(true)}
        />
      ) : (
        <Dumbbell size={22} />
      )}
    </div>
  );
}

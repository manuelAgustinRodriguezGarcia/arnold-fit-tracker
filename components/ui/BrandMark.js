"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import styles from "./BrandMark.module.css";

const TAGLINES = [
  {
    id: "en",
    content: (
      <>
        “You can have results or excuses <strong>not both</strong>”
      </>
    ),
  },
  {
    id: "es",
    content: (
      <>
        “Podés tener resultados o excusas <strong>NUNCA AMBAS</strong>”
      </>
    ),
  },
];

const ROTATE_MS = 30_000;
const FADE_MS = 180;

export function BrandMark({ heading = false }) {
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const Title = heading ? "h1" : "div";
  const line = TAGLINES[index];

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fadeTimer = 0;

    const rotateTimer = window.setInterval(() => {
      if (reduced) {
        setIndex((current) => (current + 1) % TAGLINES.length);
        return;
      }
      setHidden(true);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % TAGLINES.length);
        setHidden(false);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      window.clearInterval(rotateTimer);
      window.clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div className={styles.brand}>
      <Title className={styles.brandTitle}>
        <Logo variant="wordmark" height={52} />
        <span className="sr-only">Arnold</span>
      </Title>
      <p
        className={`${styles.tagline} ${hidden ? styles.taglineHidden : ""}`}
        aria-live="polite"
      >
        {line.content}
      </p>
    </div>
  );
}

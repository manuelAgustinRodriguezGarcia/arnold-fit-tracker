"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Pause, Play, SkipForward } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/lib/dates";
import styles from "./RestTimerPill.module.css";

gsap.registerPlugin(useGSAP);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RestTimerSlot({ restTimer, className = "" }) {
  const slotRef = useRef(null);
  const innerRef = useRef(null);
  const openRef = useRef(Boolean(restTimer));
  const savedTimer = useRef(restTimer);
  const open = Boolean(restTimer);
  const [mounted, setMounted] = useState(open);

  openRef.current = open;
  if (restTimer) {
    savedTimer.current = restTimer;
  }
  if (open && !mounted) {
    setMounted(true);
  }

  useGSAP(
    () => {
      const slot = slotRef.current;
      const inner = innerRef.current;
      if (!slot || !inner) {
        return undefined;
      }

      const reduced = prefersReducedMotion();
      const duration = reduced ? 0.01 : open ? 0.34 : 0.22;
      const ease = open ? "power3.out" : "power2.in";

      gsap.killTweensOf([slot, inner]);

      if (open) {
        gsap.fromTo(
          slot,
          { height: 0 },
          { height: "auto", duration, ease, overwrite: "auto" },
        );
        gsap.fromTo(
          inner,
          { yPercent: 110, autoAlpha: 0.35 },
          { yPercent: 0, autoAlpha: 1, duration, ease, overwrite: "auto" },
        );
        return undefined;
      }

      gsap.to(inner, {
        yPercent: 110,
        autoAlpha: 0,
        duration,
        ease,
        overwrite: "auto",
      });
      gsap.to(slot, {
        height: 0,
        duration,
        ease,
        overwrite: "auto",
        onComplete: () => {
          if (!openRef.current) {
            setMounted(false);
          }
        },
      });
      return undefined;
    },
    { dependencies: [open, mounted] },
  );

  if (!mounted || !savedTimer.current) {
    return null;
  }

  return (
    <div ref={slotRef} className={`${styles.slot} ${className}`.trim()}>
      <div ref={innerRef} className={styles.inner}>
        <RestTimerPill restTimer={savedTimer.current} />
      </div>
    </div>
  );
}

const PRESS_EVENTS = {
  onPointerDown: (event) => {
    if (event.currentTarget.disabled) {
      return;
    }
    event.currentTarget.classList.add(styles.pressed);
  },
  onPointerUp: (event) => event.currentTarget.classList.remove(styles.pressed),
  onPointerCancel: (event) => event.currentTarget.classList.remove(styles.pressed),
  onPointerLeave: (event) => event.currentTarget.classList.remove(styles.pressed),
};

export function RestTimerPill({ restTimer }) {
  const { adjustActiveRest, skipActiveRest, toggleActiveRestPause, expireActiveRest } =
    useArnold();
  const paused = Boolean(restTimer?.pausedAt);
  const liveMs = useCountdown(paused ? null : restTimer?.endsAt, expireActiveRest);
  const remainingMs = paused ? Math.max(0, Number(restTimer?.remainingMs) || 0) : liveMs;
  const canSubtract = remainingMs >= 15000;

  if (!restTimer) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.pill}>
        <button
          type="button"
          className={styles.adjust}
          onClick={() => adjustActiveRest(-15)}
          disabled={!canSubtract}
          aria-label="Restar 15 segundos"
          {...PRESS_EVENTS}
        >
          <span className={styles.press}>−15</span>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={toggleActiveRestPause}
          aria-label={paused ? "Reanudar descanso" : "Pausar descanso"}
          {...PRESS_EVENTS}
        >
          <span className={styles.iconCircle}>
            {paused ? (
              <Play size={16} strokeWidth={1.75} fill="currentColor" />
            ) : (
              <Pause size={16} strokeWidth={1.75} />
            )}
          </span>
        </button>
        <div className={styles.time}>
          <span>Descanso</span>
          <strong>{formatCountdown(remainingMs)}</strong>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={skipActiveRest}
          aria-label="Saltar descanso"
          {...PRESS_EVENTS}
        >
          <span className={styles.iconCircle}>
            <SkipForward size={16} strokeWidth={1.75} />
          </span>
        </button>
        <button
          type="button"
          className={styles.adjust}
          onClick={() => adjustActiveRest(15)}
          aria-label="Sumar 15 segundos"
          {...PRESS_EVENTS}
        >
          <span className={styles.press}>+15</span>
        </button>
      </div>
    </div>
  );
}

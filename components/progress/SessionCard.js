"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  formatDate,
  formatDurationHuman,
  formatTime,
  getTrainingTitle,
} from "@/lib/dates";
import { FATIGUE, getFatigueLabel } from "@/lib/workout";
import styles from "./SessionCard.module.css";

const HOLD_MS = 480;
const ARM_MS = 280;
const MOVE_PX = 10;

function FatigueIcon({ value }) {
  const label = getFatigueLabel(value);
  let Icon = null;

  switch (value) {
    case FATIGUE.VERY_TIRED:
      Icon = BatteryLow;
      break;
    case FATIGUE.TIRED:
      Icon = BatteryMedium;
      break;
    case FATIGUE.REGULAR:
      Icon = BatteryFull;
      break;
    default:
      Icon = null;
      break;
  }

  if (!Icon) {
    return null;
  }

  return (
    <span className={styles.fatigue} aria-label={label} title={label}>
      <Icon size={22} aria-hidden="true" />
    </span>
  );
}

export function SessionCard({ session, onOpen, onDelete }) {
  const promptId = useId();
  const timerRef = useRef(null);
  const originRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [armed, setArmed] = useState(false);

  function clearHold() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    originRef.current = null;
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!confirming) {
      setArmed(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setArmed(true);
    }, ARM_MS);

    return () => window.clearTimeout(timeoutId);
  }, [confirming]);

  useEffect(() => {
    if (!confirming) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setConfirming(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirming]);

  function handleOpen() {
    if (suppressClickRef.current || confirming) {
      suppressClickRef.current = false;
      return;
    }
    onOpen();
  }

  function onPointerDown(event) {
    if (confirming) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    suppressClickRef.current = false;
    originRef.current = { x: event.clientX, y: event.clientY };
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      originRef.current = null;
      suppressClickRef.current = true;
      setConfirming(true);
    }, HOLD_MS);
  }

  function onPointerMove(event) {
    if (!originRef.current || timerRef.current === null) {
      return;
    }
    const dx = event.clientX - originRef.current.x;
    const dy = event.clientY - originRef.current.y;
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) {
      clearHold();
    }
  }

  function onPointerEnd() {
    clearHold();
  }

  return (
    <Card
      className={`${styles.card} ${confirming ? styles.confirming : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <button type="button" className={styles.body} onClick={handleOpen}>
        <div className={styles.banner}>
          <h3>
            {getTrainingTitle(session.startedAt)}
            <span className={styles.metaSep} aria-hidden="true">
              |
            </span>
            <span className={styles.when}>{formatDate(session.startedAt)}</span>
            <span className={styles.metaSep} aria-hidden="true">
              |
            </span>
            <span className={styles.when}>{formatTime(session.startedAt)}</span>
          </h3>
        </div>
        <div className={styles.facts}>
          <dl>
            <div>
              <dt>Rutina</dt>
              <dd>{session.routineName}</dd>
            </div>
            <div>
              <dt>Duración</dt>
              <dd>{formatDurationHuman(session.durationSeconds)}</dd>
            </div>
            <div>
              <dt>Cansancio</dt>
              <dd>
                <FatigueIcon value={session.fatigue} />
              </dd>
            </div>
          </dl>
        </div>
      </button>
      {confirming ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={promptId}
        >
          <p id={promptId} className={styles.prompt}>
            ¿Desea eliminar este entrenamiento?
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              disabled={!armed}
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.remove}
              disabled={!armed}
              onClick={onDelete}
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

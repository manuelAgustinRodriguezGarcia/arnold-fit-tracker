"use client";

import { useMemo, useState } from "react";
import { ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/Button";
import { ActivityChart } from "@/components/progress/ActivityChart";
import { ExerciseProgress } from "@/components/progress/ExerciseProgress";
import { SessionCard } from "@/components/progress/SessionCard";
import { TimeByRoutineChart } from "@/components/progress/TimeByRoutineChart";
import { useArnold } from "@/hooks/useArnold";
import { formatDurationHuman, formatPeriodLabel, getPeriodRange } from "@/lib/dates";
import {
  getActivityByDay,
  getActivityByWeek,
  getPeriodMetrics,
  getPeriodSessions,
  getTimeByRoutine,
} from "@/lib/exerciseStats";
import styles from "./ProgressView.module.css";

export function ProgressView({ onOpenSession, onDeleteSession }) {
  const { sessions } = useArnold();
  const [period, setPeriod] = useState("week");
  const [offset, setOffset] = useState(0);

  const range = getPeriodRange(period, offset);
  const periodSessions = useMemo(
    () => getPeriodSessions(sessions, period, offset),
    [sessions, period, offset],
  );
  const metrics = getPeriodMetrics(periodSessions);
  const routineTimes = getTimeByRoutine(periodSessions);
  const days = getActivityByDay(periodSessions, range);
  const weeks = getActivityByWeek(periodSessions, range);
  const ordered = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  return (
    <section
      className={`${styles.view} ${ordered.length === 0 ? styles.centered : ""}`}
    >
      {ordered.length === 0 ? (
        <EmptyState
          icon={<ChartNoAxesColumnIncreasing size={28} />}
          title="Todavía no hay entrenamientos"
          description="Cuando termines tu primera rutina aparecerá acá."
        />
      ) : (
        <>
          <div className={styles.period}>
            <div className={styles.tabs} role="tablist" aria-label="Período">
              <button
                type="button"
                role="tab"
                aria-selected={period === "week"}
                className={styles.tab}
                onClick={() => {
                  setPeriod("week");
                  setOffset(0);
                }}
              >
                Semana
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={period === "month"}
                className={styles.tab}
                onClick={() => {
                  setPeriod("month");
                  setOffset(0);
                }}
              >
                Mes
              </button>
            </div>
            <div className={styles.nav}>
              <IconButton
                label="Período anterior"
                onClick={() => setOffset((value) => value - 1)}
              >
                <ChevronLeft size={20} />
              </IconButton>
              <p>{formatPeriodLabel(period, range)}</p>
              <IconButton
                label="Período siguiente"
                onClick={() => setOffset((value) => value + 1)}
                disabled={offset >= 0}
              >
                <ChevronRight size={20} />
              </IconButton>
            </div>
          </div>

          <div className={styles.metrics}>
            <article>
              <strong>{formatDurationHuman(metrics.durationSeconds)}</strong>
              <span>Tiempo total</span>
            </article>
            <article>
              <strong>{metrics.trainings}</strong>
              <span>Entrenamientos</span>
            </article>
            <article>
              <strong>{metrics.exercises}</strong>
              <span>Ejercicios</span>
            </article>
          </div>

          <TimeByRoutineChart items={routineTimes} />
          <ActivityChart period={period} days={days} weeks={weeks} />
          <ExerciseProgress sessions={sessions} />

          <div className={styles.list}>
            {ordered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onOpen={() => onOpenSession(session)}
                onDelete={() => onDeleteSession(session)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
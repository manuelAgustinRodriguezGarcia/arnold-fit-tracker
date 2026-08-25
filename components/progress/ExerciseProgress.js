"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useArnold } from "@/hooks/useArnold";
import { EXERCISE_TYPE, formatSeconds, normalizeName } from "@/lib/exercises";
import { SEARCH_FIELD } from "@/lib/inputAttrs";
import { getExerciseHistory, getExerciseProgressSummary } from "@/lib/exerciseStats";
import styles from "./ExerciseProgress.module.css";

function Sparkline({ values }) {
  if (values.length < 2) {
    return null;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 36 - ((value - min) / (max - min || 1)) * 32;
    return `${x},${y}`;
  });
  return (
    <svg className={styles.chart} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        fill="none"
        stroke="var(--bronze-dark)"
        strokeWidth="2"
        points={points.join(" ")}
      />
    </svg>
  );
}

export function ExerciseProgress({ sessions }) {
  const { exercises } = useArnold();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const filtered = useMemo(() => {
    const key = normalizeName(query);
    const list = [...exercises].sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!key) {
      return list.slice(0, 6);
    }
    return list.filter((exercise) => normalizeName(exercise.name).includes(key));
  }, [exercises, query]);

  const selected = exercises.find((exercise) => exercise.id === selectedId) || null;
  const history = selected
    ? getExerciseHistory(sessions, selected.id, selected.name)
    : [];
  const summary = getExerciseProgressSummary(history);
  const lastSets = history.at(-1)?.sets || [];

  return (
    <section className={styles.section}>
      <h3>Evolución por ejercicio</h3>
      <label className={styles.search}>
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar ejercicio</span>
        <input
          {...SEARCH_FIELD}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar ejercicio"
        />
      </label>
      <ul className={styles.list}>
        {filtered.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              className={styles.item}
              aria-pressed={selectedId === exercise.id}
              onClick={() => setSelectedId(exercise.id)}
            >
              {exercise.name}
            </button>
          </li>
        ))}
      </ul>

      {!selected ? (
        <p className={styles.empty}>Elegí un ejercicio para ver su historial.</p>
      ) : !summary ? (
        <p className={styles.empty}>Todavía no hay registros de este ejercicio.</p>
      ) : (
        <>
          <div className={styles.stats}>
            <article>
              <strong>{summary.trainings}</strong>
              <span>Entrenamientos</span>
            </article>
            <article>
              <strong>{summary.sets}</strong>
              <span>Series</span>
            </article>
            {summary.type === EXERCISE_TYPE.TIMED ? (
              <>
                <article>
                  <strong>{formatSeconds(summary.durationSeconds)}</strong>
                  <span>Duración total</span>
                </article>
                <article>
                  <strong className={styles.record}>{formatSeconds(summary.bestDuration)}</strong>
                  <span>Mejor duración</span>
                </article>
              </>
            ) : (
              <>
                <article>
                  <strong className={styles.record}>{summary.maxWeight ?? "—"}</strong>
                  <span>Máximo peso</span>
                </article>
                <article>
                  <strong>{summary.lastWeight ?? "—"}</strong>
                  <span>Último peso</span>
                </article>
                <article>
                  <strong>{summary.reps}</strong>
                  <span>Repeticiones</span>
                </article>
              </>
            )}
          </div>
          {summary.type === EXERCISE_TYPE.TIMED ? (
            <Sparkline values={history.map((entry) => entry.durationSeconds)} />
          ) : (
            <Sparkline
              values={history.map((entry) => entry.maxWeight || 0)}
            />
          )}
          <div className={styles.sets}>
            {lastSets.map((set) => (
              <p key={set.id} className={styles.setLine}>
                Serie {set.number}
                {summary.type === EXERCISE_TYPE.TIMED
                  ? ` · ${formatSeconds(set.durationSeconds)}`
                  : ` · ${set.reps ?? "—"} reps · ${set.weightKg != null ? `${set.weightKg} KG` : "— KG"}`}
              </p>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
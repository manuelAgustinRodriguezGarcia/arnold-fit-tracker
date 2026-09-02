"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
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
  const listId = useId();
  const pickerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sorted = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [exercises],
  );
  const selected = exercises.find((exercise) => exercise.id === selectedId) || null;

  const filtered = useMemo(() => {
    const key = normalizeName(query);
    const browsingSelected = selected && normalizeName(selected.name) === key;
    if (!key || browsingSelected) {
      return sorted;
    }
    return sorted.filter((exercise) => normalizeName(exercise.name).includes(key));
  }, [query, selected, sorted]);

  const safeIndex = filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onPointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function pickExercise(exercise) {
    setSelectedId(exercise.id);
    setQuery(exercise.name);
    setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      const exercise = filtered[safeIndex];
      if (exercise) {
        pickExercise(exercise);
      }
    }
  }

  const history = selected
    ? getExerciseHistory(sessions, selected.id, selected.name)
    : [];
  const summary = getExerciseProgressSummary(history);
  const lastSets = history.at(-1)?.sets || [];
  const activeExercise = filtered[safeIndex];

  return (
    <section className={styles.section}>
      <h3>Evolución por ejercicio</h3>
      <div className={styles.picker} ref={pickerRef}>
        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar ejercicio</span>
          <input
            {...SEARCH_FIELD}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && activeExercise ? `${listId}-${activeExercise.id}` : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar ejercicio"
          />
          <button
            type="button"
            className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            tabIndex={-1}
            aria-label={open ? "Cerrar lista de ejercicios" : "Ver todos los ejercicios"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </label>
        {open ? (
          <ul id={listId} role="listbox" className={styles.menu} aria-label="Ejercicios">
            {filtered.length === 0 ? (
              <li className={styles.menuEmpty}>No hay ejercicios para mostrar</li>
            ) : (
              filtered.map((exercise, index) => (
                <li key={exercise.id}>
                  <button
                    id={`${listId}-${exercise.id}`}
                    type="button"
                    role="option"
                    aria-selected={selectedId === exercise.id}
                    className={`${styles.option} ${
                      index === safeIndex ? styles.optionActive : ""
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pickExercise(exercise)}
                  >
                    {exercise.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

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

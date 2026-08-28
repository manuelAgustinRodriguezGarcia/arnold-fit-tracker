"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import { ChevronDown, Maximize2, X } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  DATE_LOCALE,
  formatMonthYear,
  getCalendarYearRange,
  getMonthCells,
  getMonthNames,
  getWeekdayShortLabels,
  localDateKey,
} from "@/lib/dates";
import styles from "./ProgressCalendar.module.css";

gsap.registerPlugin(useGSAP, Flip);

const MONTH_NAMES = getMonthNames("long");
const MONTH_SHORT = getMonthNames("short");
const WEEKDAYS = getWeekdayShortLabels();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function sessionDayKey(session) {
  return localDateKey(session.endedAt || session.startedAt);
}

function sessionRoutineName(session) {
  return session?.routineName || session?.routineSnapshot?.name || "Entrenamiento";
}

function uniqueRoutineNames(daySessions) {
  const names = [];
  for (const session of daySessions) {
    const name = sessionRoutineName(session);
    if (!names.includes(name)) {
      names.push(name);
    }
  }
  return names;
}

export function ProgressCalendar({ sessions, expanded, onExpandedChange }) {
  const todayKey = localDateKey(new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [picker, setPicker] = useState(null);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const shellRef = useRef(null);
  const selectedYearRef = useRef(null);

  const cells = useMemo(() => getMonthCells(year, month), [year, month]);
  const years = useMemo(() => {
    const range = getCalendarYearRange(sessions);
    if (!range.includes(year)) {
      return [...range, year].sort((a, b) => a - b);
    }
    return range;
  }, [sessions, year]);
  const sessionsByDay = useMemo(() => {
    const map = new Map();
    for (const session of sessions || []) {
      const key = sessionDayKey(session);
      const list = map.get(key);
      if (list) {
        list.push(session);
      } else {
        map.set(key, [session]);
      }
    }
    return map;
  }, [sessions]);
  const counts = useMemo(() => {
    const map = new Map();
    for (const [key, list] of sessionsByDay) {
      map.set(key, list.length);
    }
    return map;
  }, [sessionsByDay]);

  const monthLabel = formatMonthYear(year, month);

  useBodyScrollLock(expanded);

  useGSAP({ scope: shellRef });

  const toggleExpanded = useCallback(
    (next = !expanded) => {
      if (next === expanded) {
        return;
      }

      const animate = !prefersReducedMotion() && shellRef.current;
      const state = animate ? Flip.getState(shellRef.current) : null;
      flushSync(() => {
        onExpandedChange(next);
        if (!next) {
          setPicker(null);
        }
      });

      if (!state) {
        return;
      }

      Flip.from(state, {
        duration: next ? 0.42 : 0.32,
        ease: "power2.inOut",
        absolute: true,
        nested: true,
      });
    },
    [expanded, onExpandedChange],
  );

  useEffect(() => {
    if (picker !== "year" || !selectedYearRef.current) {
      return undefined;
    }
    selectedYearRef.current.scrollIntoView({ block: "center" });
    return undefined;
  }, [picker, year]);

  useEffect(() => {
    if (!expanded && !picker) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key !== "Escape") {
        return;
      }
      if (picker) {
        setPicker(null);
        return;
      }
      if (expanded) {
        toggleExpanded(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, picker, toggleExpanded]);

  function onDayClick(cell) {
    setSelectedKey(cell.key);
    if (cell.outside) {
      setYear(cell.year);
      setMonth(cell.month);
    }
    if (!expanded) {
      toggleExpanded(true);
    }
  }

  function onShellPointerUp(event) {
    if (expanded || picker) {
      return;
    }
    if (event.target.closest("[data-calendar-chrome]")) {
      return;
    }
    toggleExpanded(true);
  }

  const selectedNames = uniqueRoutineNames(sessionsByDay.get(selectedKey) || []);
  const selectedDate = selectedKey
    ? new Date(`${selectedKey}T12:00:00`)
    : null;
  const selectedCaption = selectedDate
    ? `${selectedDate.toLocaleDateString(DATE_LOCALE, {
        day: "numeric",
        month: "long",
      })}${selectedNames.length ? ` · ${selectedNames.join(" · ")}` : ""}`
    : "";

  return (
    <div className={styles.slot}>
      <div
        ref={shellRef}
        className={`${styles.shell} ${expanded ? styles.expanded : ""}`}
        role="region"
        aria-label={`Calendario ${monthLabel}`}
        onPointerUp={onShellPointerUp}
      >
        <div className={styles.body}>
          <div className={styles.weekdays} aria-hidden="true">
            {WEEKDAYS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className={styles.grid} role="grid" aria-label={monthLabel}>
            {cells.map((cell) => {
              const count = counts.get(cell.key) || 0;
              const names = uniqueRoutineNames(sessionsByDay.get(cell.key) || []);
              const selected = cell.key === selectedKey;
              const today = cell.key === todayKey;
              return (
                <button
                  key={cell.key}
                  type="button"
                  role="gridcell"
                  className={`${styles.day} ${cell.outside ? styles.outside : ""} ${
                    today ? styles.today : ""
                  } ${selected ? styles.selected : ""} ${count ? styles.trained : ""}`}
                  aria-current={today ? "date" : undefined}
                  aria-selected={selected}
                  aria-label={`${cell.day} de ${MONTH_NAMES[cell.month]}${
                    names.length ? `, ${names.join(", ")}` : ""
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDayClick(cell);
                  }}
                >
                  <span>{cell.day}</span>
                  {count ? <span className={styles.dot} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          {expanded ? (
            <p className={styles.caption}>{selectedCaption}</p>
          ) : null}

          {picker ? (
            <div
              className={styles.picker}
              data-calendar-chrome
              onPointerUp={(event) => event.stopPropagation()}
            >
              <div className={styles.pickerHead}>
                <h3>{picker === "month" ? "Mes" : "Año"}</h3>
                <IconButton label="Cerrar selector" onClick={() => setPicker(null)}>
                  <X size={18} />
                </IconButton>
              </div>
              {picker === "month" ? (
                <div className={styles.monthList} role="listbox" aria-label="Mes">
                  {MONTH_SHORT.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      role="option"
                      aria-selected={index === month}
                      className={styles.option}
                      onClick={() => {
                        setMonth(index);
                        setPicker(null);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.yearList} role="listbox" aria-label="Año">
                  {years.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="option"
                      aria-selected={item === year}
                      className={styles.yearOption}
                      ref={item === year ? selectedYearRef : undefined}
                      onClick={() => {
                        setYear(item);
                        setPicker(null);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div
          className={styles.footer}
          data-calendar-chrome
          onPointerUp={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={`${styles.selector} ${picker === "month" ? styles.selectorOpen : ""}`}
            aria-haspopup="listbox"
            aria-expanded={picker === "month"}
            onClick={() => setPicker((current) => (current === "month" ? null : "month"))}
          >
            <span>{MONTH_NAMES[month]}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.selector} ${picker === "year" ? styles.selectorOpen : ""}`}
            aria-haspopup="listbox"
            aria-expanded={picker === "year"}
            onClick={() => setPicker((current) => (current === "year" ? null : "year"))}
          >
            <span>{year}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {expanded ? (
            <IconButton
              label="Cerrar calendario"
              aria-expanded="true"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(false);
              }}
            >
              <X size={20} />
            </IconButton>
          ) : (
            <IconButton
              label="Ampliar calendario"
              aria-expanded="false"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(true);
              }}
            >
              <Maximize2 size={18} />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}

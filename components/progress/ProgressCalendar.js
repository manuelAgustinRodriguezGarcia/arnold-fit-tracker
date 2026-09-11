"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Dumbbell, SportShoe, X } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import {
  DATE_LOCALE,
  formatDurationHuman,
  formatMonthYear,
  getCalendarYearRange,
  getMonthCells,
  getMonthNames,
  getWeekdayShortLabels,
  localDateKey,
} from "@/lib/dates";
import { getSessionActivityFlags } from "@/lib/workout";
import styles from "./ProgressCalendar.module.css";

const MONTH_NAMES = getMonthNames("long");
const MONTH_SHORT = getMonthNames("short");
const WEEKDAYS = getWeekdayShortLabels();
const PICKER_MS = 220;

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

export function ProgressCalendar({ sessions }) {
  const todayKey = localDateKey(new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerClosing, setPickerClosing] = useState(false);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const selectedYearRef = useRef(null);
  const pickerExitRef = useRef(0);

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
  const activities = useMemo(() => {
    const map = new Map();
    for (const [key, list] of sessionsByDay) {
      let hasStrength = false;
      let hasCardio = false;
      for (const session of list) {
        const flags = getSessionActivityFlags(session);
        hasStrength = hasStrength || flags.hasStrength;
        hasCardio = hasCardio || flags.hasCardio;
      }
      if (!hasStrength && !hasCardio && list.length > 0) {
        hasStrength = true;
      }
      map.set(key, { hasStrength, hasCardio });
    }
    return map;
  }, [sessionsByDay]);

  const monthLabel = formatMonthYear(year, month);

  useEffect(() => {
    return () => {
      if (pickerExitRef.current) {
        window.clearTimeout(pickerExitRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pickerOpen) {
      if (pickerExitRef.current) {
        window.clearTimeout(pickerExitRef.current);
        pickerExitRef.current = 0;
      }
      setPickerVisible(true);
      setPickerClosing(false);
      return undefined;
    }

    if (!pickerVisible) {
      return undefined;
    }

    if (prefersReducedMotion()) {
      setPickerVisible(false);
      setPickerClosing(false);
      return undefined;
    }

    setPickerClosing(true);
    pickerExitRef.current = window.setTimeout(() => {
      setPickerVisible(false);
      setPickerClosing(false);
      pickerExitRef.current = 0;
    }, PICKER_MS);

    return () => {
      if (pickerExitRef.current) {
        window.clearTimeout(pickerExitRef.current);
        pickerExitRef.current = 0;
      }
    };
  }, [pickerOpen, pickerVisible]);

  useEffect(() => {
    if (!pickerVisible || pickerClosing || !selectedYearRef.current) {
      return undefined;
    }
    selectedYearRef.current.scrollIntoView({ block: "nearest", inline: "center" });
    return undefined;
  }, [pickerVisible, pickerClosing, year]);

  useEffect(() => {
    if (!pickerOpen) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setPickerOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pickerOpen]);

  function closePicker() {
    setPickerOpen(false);
  }

  function onDayClick(cell) {
    setSelectedKey(cell.key);
    if (cell.outside) {
      setYear(cell.year);
      setMonth(cell.month);
    }
  }

  function shiftMonth(delta) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    closePicker();
  }

  const selectedSessions = sessionsByDay.get(selectedKey) || [];
  const selectedNames = uniqueRoutineNames(selectedSessions);
  const selectedDuration = selectedSessions.reduce(
    (total, session) => total + (Number(session.durationSeconds) || 0),
    0,
  );
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
    <div className={styles.shell} role="region" aria-label={`Calendario ${monthLabel}`}>
      <div className={styles.header}>
        <IconButton label="Mes anterior" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={20} />
        </IconButton>
        <button
          type="button"
          className={`${styles.selector} ${styles.monthSelector} ${
            pickerOpen || pickerVisible ? styles.selectorOpen : ""
          }`}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((current) => !current)}
        >
          <span>
            {MONTH_NAMES[month]} {year}
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        <IconButton label="Mes siguiente" onClick={() => shiftMonth(1)}>
          <ChevronRight size={20} />
        </IconButton>
      </div>

      <div className={styles.body}>
        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAYS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className={styles.grid} role="grid" aria-label={monthLabel}>
          {cells.map((cell) => {
            const count = counts.get(cell.key) || 0;
            const activity = activities.get(cell.key) || {
              hasStrength: false,
              hasCardio: false,
            };
            const names = uniqueRoutineNames(sessionsByDay.get(cell.key) || []);
            const selected = cell.key === selectedKey;
            const today = cell.key === todayKey;
            const activityLabels = [
              activity.hasStrength ? "pesas" : null,
              activity.hasCardio ? "cardio" : null,
            ].filter(Boolean);
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
                }${activityLabels.length ? `, ${activityLabels.join(" y ")}` : ""}`}
                onClick={() => onDayClick(cell)}
              >
                <span className={styles.dayNumber}>{cell.day}</span>
                {activity.hasStrength || activity.hasCardio ? (
                  <span className={styles.dayIcons} aria-hidden="true">
                    {activity.hasStrength ? (
                      <span className={styles.dayIcon}>
                        <Dumbbell size={12} strokeWidth={2.4} />
                      </span>
                    ) : null}
                    {activity.hasCardio ? (
                      <span className={styles.dayIcon}>
                        <SportShoe size={12} strokeWidth={2.4} />
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {pickerVisible ? (
          <div
            className={`${styles.picker} ${pickerClosing ? styles.pickerOut : styles.pickerIn}`}
            role="dialog"
            aria-label="Elegir mes y año"
            aria-hidden={pickerClosing || undefined}
          >
            <div className={styles.pickerHead}>
              <h3>Mes y año</h3>
              <IconButton label="Cerrar selector" onClick={closePicker}>
                <X size={18} />
              </IconButton>
            </div>
            <div className={styles.yearRow} role="listbox" aria-label="Año">
              {years.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={item === year}
                  className={styles.yearChip}
                  ref={item === year ? selectedYearRef : undefined}
                  onClick={() => setYear(item)}
                >
                  {item}
                </button>
              ))}
            </div>
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
                    closePicker();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.footer}>
        <p className={styles.caption}>{selectedCaption}</p>
        {selectedDuration > 0 ? (
          <p className={styles.captionDuration}>{formatDurationHuman(selectedDuration)}</p>
        ) : null}
      </div>
    </div>
  );
}

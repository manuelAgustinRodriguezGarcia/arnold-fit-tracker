"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, GlassWater } from "lucide-react";
import { NUMBER_FIELD } from "@/lib/inputAttrs";
import { fromWaterMl, parseWaterAmount, toWaterMl } from "@/lib/hydration";
import styles from "./HydrationStep.module.css";

const UNITS = ["L", "ml"];

export function HydrationStep({ onChange }) {
  const listId = useId();
  const pickerRef = useRef(null);
  const [unit, setUnit] = useState("L");
  const [text, setText] = useState("");
  const [unitOpen, setUnitOpen] = useState(false);

  const parsed = parseWaterAmount(text);

  useEffect(() => {
    if (!unitOpen) {
      return undefined;
    }

    function onPointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setUnitOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setUnitOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [unitOpen]);

  function emit(nextMl) {
    onChange?.(nextMl);
  }

  function onTextChange(value) {
    setText(value);
    const next = parseWaterAmount(value);
    if (next.invalid || next.empty) {
      emit(null);
      return;
    }
    emit(toWaterMl(next.value, unit));
  }

  function onUnitChange(nextUnit) {
    const currentMl = parsed.invalid || parsed.empty ? null : toWaterMl(parsed.value, unit);
    setUnit(nextUnit);
    setUnitOpen(false);
    if (currentMl == null) {
      return;
    }
    setText(fromWaterMl(currentMl, nextUnit));
    emit(currentMl);
  }

  return (
    <div className={styles.wrap}>
      <GlassWater className={styles.hero} size={48} aria-hidden="true" />

      <div className={styles.field}>
        <label className={styles.amount}>
          <span className="sr-only">Cantidad de agua tomada</span>
          <input
            {...NUMBER_FIELD}
            inputMode="decimal"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder={unit === "L" ? "1,5" : "500"}
            aria-invalid={parsed.invalid}
          />
        </label>
        <div className={styles.unitPicker} ref={pickerRef}>
          <button
            type="button"
            className={`${styles.unit} ${unitOpen ? styles.unitOpen : ""}`}
            aria-label="Unidad"
            aria-haspopup="listbox"
            aria-expanded={unitOpen}
            aria-controls={listId}
            onClick={() => setUnitOpen((current) => !current)}
          >
            <span>{unit}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {unitOpen ? (
            <ul id={listId} className={styles.menu} role="listbox" aria-label="Unidad">
              {UNITS.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={unit === item}
                    className={styles.option}
                    onClick={() => onUnitChange(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {parsed.invalid ? (
        <p className={styles.hint}>Ingresá un número válido.</p>
      ) : null}
    </div>
  );
}

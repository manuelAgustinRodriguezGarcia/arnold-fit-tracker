"use client";

import { useState } from "react";
import { GlassWater } from "lucide-react";
import { NUMBER_FIELD } from "@/lib/inputAttrs";
import { fromWaterMl, parseWaterAmount, toWaterMl } from "@/lib/hydration";
import styles from "./HydrationStep.module.css";

export function HydrationStep({ onChange }) {
  const [unit, setUnit] = useState("L");
  const [text, setText] = useState("");

  const parsed = parseWaterAmount(text);

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
    if (currentMl == null) {
      return;
    }
    setText(fromWaterMl(currentMl, nextUnit));
    emit(currentMl);
  }

  return (
    <div className={styles.wrap}>
      <GlassWater className={styles.hero} size={48} aria-hidden="true" />

      <label className={styles.field}>
        <span className="sr-only">Cantidad de agua tomada</span>
        <input
          {...NUMBER_FIELD}
          inputMode="decimal"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={unit === "L" ? "1,5" : "500"}
          aria-invalid={parsed.invalid}
        />
        <select
          className={styles.unit}
          value={unit}
          aria-label="Unidad"
          onChange={(event) => onUnitChange(event.target.value)}
        >
          <option value="L">L</option>
          <option value="ml">ml</option>
        </select>
      </label>

      {parsed.invalid ? (
        <p className={styles.hint}>Ingresá un número válido.</p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { GlassWater, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useArnold } from "@/hooks/useArnold";
import { NUMBER_FIELD } from "@/lib/inputAttrs";
import {
  formatWaterMl,
  maxBottlesForCapacity,
  normalizeBottleCapacityMl,
  parseWaterAmount,
  waterMlFromBottles,
} from "@/lib/hydration";
import styles from "./HydrationStep.module.css";

export function HydrationStep({ onChange }) {
  const { settings, updateSettings } = useArnold();
  const capacityMl = normalizeBottleCapacityMl(settings?.bottleCapacityMl);
  const [capacityText, setCapacityText] = useState("");
  const [count, setCount] = useState(0);

  const capacityParsed = parseWaterAmount(capacityText);
  const maxBottles = maxBottlesForCapacity(capacityMl);

  useEffect(() => {
    if (capacityMl <= 0) {
      onChange?.(null);
      return;
    }
    onChange?.(waterMlFromBottles(count, capacityMl));
  }, [capacityMl, count, onChange]);

  function saveCapacity(rawText) {
    const parsed = parseWaterAmount(rawText);
    if (parsed.empty || parsed.invalid || parsed.value <= 0) {
      return false;
    }
    const next = normalizeBottleCapacityMl(parsed.value);
    if (next <= 0) {
      return false;
    }
    updateSettings({ bottleCapacityMl: next });
    setCapacityText("");
    setCount(0);
    return true;
  }

  function onCapacityTextChange(value) {
    setCapacityText(value);
  }

  function onCapacityKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveCapacity(capacityText);
    }
  }

  function bump(delta) {
    setCount((current) => {
      const next = Math.max(0, Math.min(maxBottles, current + delta));
      return next;
    });
  }

  if (capacityMl <= 0) {
    return (
      <div className={styles.wrap}>
        <GlassWater className={styles.hero} size={48} aria-hidden="true" />
        <p className={styles.prompt}>¿Cuánto entra en tu botella?</p>
        <p className={styles.sub}>Se guarda en Ajustes para la próxima.</p>
        <div className={styles.capacityField}>
          <label className={styles.amount}>
            <span className="sr-only">Capacidad de la botella en ml</span>
            <input
              {...NUMBER_FIELD}
              inputMode="decimal"
              value={capacityText}
              onChange={(event) => onCapacityTextChange(event.target.value)}
              onKeyDown={onCapacityKeyDown}
              placeholder="750"
              aria-invalid={capacityParsed.invalid}
            />
          </label>
          <span className={styles.unitFixed} aria-hidden="true">
            Ml
          </span>
        </div>
        {capacityParsed.invalid ? (
          <p className={styles.hint}>Ingresá un número válido.</p>
        ) : null}
        <Button
          size="lg"
          disabled={
            capacityParsed.empty ||
            capacityParsed.invalid ||
            !(capacityParsed.value > 0)
          }
          onClick={() => saveCapacity(capacityText)}
        >
          Listo
        </Button>
      </div>
    );
  }

  const totalMl = waterMlFromBottles(count, capacityMl);

  return (
    <div className={styles.wrap}>
      <div className={styles.glasses} aria-hidden="true">
        {count === 0 ? (
          <GlassWater className={styles.hero} size={48} />
        ) : (
          Array.from({ length: count }, (_, index) => (
            <GlassWater
              key={`${capacityMl}-${index}`}
              className={styles.glass}
              size={28}
            />
          ))
        )}
      </div>

      <div className={styles.stepper} role="group" aria-label="Botellas tomadas">
        <button
          type="button"
          className={styles.stepBtn}
          aria-label="Quitar botella"
          disabled={count <= 0}
          onClick={() => bump(-1)}
        >
          <Minus size={20} aria-hidden="true" />
        </button>
        <div className={styles.count} aria-live="polite">
          {count}
        </div>
        <button
          type="button"
          className={styles.stepBtn}
          aria-label="Agregar botella"
          disabled={count >= maxBottles}
          onClick={() => bump(1)}
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>

      <p className={styles.sub}>
        {count === 0
          ? `${formatWaterMl(capacityMl)} por botella`
          : `${count} × ${formatWaterMl(capacityMl)}${
              totalMl > 0 ? ` · ${formatWaterMl(totalMl)}` : ""
            }`}
      </p>
    </div>
  );
}

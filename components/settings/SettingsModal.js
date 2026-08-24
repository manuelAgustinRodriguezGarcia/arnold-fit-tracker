"use client";

import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import { normalizeThemePalette, THEME_PALETTES } from "@/lib/themes";
import styles from "./SettingsModal.module.css";

export function SettingsModal({ open, onClose }) {
  const { settings, updateSettings } = useArnold();
  const selected = normalizeThemePalette(settings?.themePalette);

  return (
    <Modal open={open} title="Ajustes" onClose={onClose}>
      <section className={styles.section}>
        <h3>Apariencia</h3>
        <p>Paleta de color</p>
        <div className={styles.list} role="radiogroup" aria-label="Paleta de color">
          {THEME_PALETTES.map((palette) => {
            const checked = selected === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                className={styles.option}
                role="radio"
                aria-checked={checked}
                onClick={() => updateSettings({ themePalette: palette.id })}
              >
                <span className={styles.optionHead}>
                  <strong>{palette.name}</strong>
                  {checked ? <Check size={18} aria-hidden="true" /> : null}
                </span>
                <span className={styles.swatches} aria-hidden="true">
                  {palette.swatches.map((color) => (
                    <span
                      key={color}
                      className={styles.swatch}
                      style={{ background: color }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </Modal>
  );
}

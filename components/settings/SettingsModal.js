"use client";

import { Check, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import { useSpotify } from "@/context/SpotifyContext";
import {
  APPEARANCE_DARK,
  APPEARANCE_LIGHT,
  normalizeAppearance,
  normalizeThemePalette,
  paletteUsesAppearance,
  THEME_PALETTES,
} from "@/lib/themes";
import styles from "./SettingsModal.module.css";

export function SettingsModal({ open, onClose }) {
  const { settings, updateSettings } = useArnold();
  const {
    clientIdConfigured,
    isConnected,
    isOnline,
    error,
    connect,
    disconnect,
  } = useSpotify();
  const selected = normalizeThemePalette(settings?.themePalette);
  const appearance = normalizeAppearance(settings?.appearance);
  const appearanceEnabled = paletteUsesAppearance(selected);

  return (
    <Modal open={open} title="Ajustes" onClose={onClose}>
      <section className={styles.section}>
        <h3>Paleta</h3>
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

      <section className={styles.section}>
        <h3>Apariencia</h3>
        <p>Light o Dark para Classic y Stone.</p>
        <div
          className={styles.appearance}
          role="radiogroup"
          aria-label="Apariencia"
          aria-disabled={!appearanceEnabled}
        >
          <button
            type="button"
            className={styles.appearanceBtn}
            role="radio"
            aria-checked={appearance === APPEARANCE_LIGHT}
            disabled={!appearanceEnabled}
            onClick={() => updateSettings({ appearance: APPEARANCE_LIGHT })}
          >
            <Sun size={18} aria-hidden="true" />
            Light
          </button>
          <button
            type="button"
            className={styles.appearanceBtn}
            role="radio"
            aria-checked={appearance === APPEARANCE_DARK}
            disabled={!appearanceEnabled}
            onClick={() => updateSettings({ appearance: APPEARANCE_DARK })}
          >
            <Moon size={18} aria-hidden="true" />
            Dark
          </button>
        </div>
        {!appearanceEnabled ? (
          <p className={styles.muted}>Arnold Neon no cambia con Light/Dark.</p>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3>Spotify</h3>
        <p>Controlá tu música durante el entrenamiento.</p>
        {isConnected ? (
          <div className={styles.spotifyStatus}>
            <span className={styles.connectedDot} aria-hidden="true" />
            <span>Conectado</span>
          </div>
        ) : (
          <p className={styles.muted}>No conectado</p>
        )}
        {!isOnline ? (
          <p className={styles.muted}>Spotify no disponible sin conexión</p>
        ) : null}
        {error && isConnected ? <p className={styles.muted}>{error}</p> : null}
        {!clientIdConfigured ? (
          <p className={styles.muted}>Falta configurar Spotify.</p>
        ) : null}
        {isConnected ? (
          <Button variant="secondary" size="lg" onClick={disconnect}>
            Desconectar Spotify
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={connect}
            disabled={!clientIdConfigured || !isOnline}
          >
            Conectar Spotify
          </Button>
        )}
      </section>
    </Modal>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { GlassWater, Moon, Palette, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import { useSpotify } from "@/context/SpotifyContext";
import { SpotifyIcon } from "@/components/ui/SpotifyIcon";
import { NUMBER_FIELD } from "@/lib/inputAttrs";
import { normalizeBottleCapacityMl, parseWaterAmount } from "@/lib/hydration";
import {
  APPEARANCE_DARK,
  APPEARANCE_LIGHT,
  getThemeChrome,
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
  const [bottleText, setBottleText] = useState("");
  const bottleParsed = parseWaterAmount(bottleText);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const ml = normalizeBottleCapacityMl(settings?.bottleCapacityMl);
      setBottleText(ml > 0 ? String(ml) : "");
    }
    wasOpenRef.current = open;
  }, [open, settings?.bottleCapacityMl]);

  function onBottleChange(value) {
    setBottleText(value);
    const parsed = parseWaterAmount(value);
    if (parsed.empty) {
      updateSettings({ bottleCapacityMl: 0 });
      return;
    }
    if (!parsed.invalid && parsed.value >= 0) {
      updateSettings({ bottleCapacityMl: parsed.value });
    }
  }

  return (
    <Modal
      open={open}
      title={
        <span className={styles.modalTitle}>
          <Settings size={26} strokeWidth={2.2} aria-hidden="true" />
          Ajustes
        </span>
      }
      onClose={onClose}
    >
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Palette size={18} aria-hidden="true" />
          Paleta y modo
        </h3>
        <p>Elegí la paleta y el modo Light o Dark (Classic y Stone).</p>
        <div
          className={styles.paletteGrid}
          role="radiogroup"
          aria-label="Paleta de color"
        >
          {THEME_PALETTES.map((palette) => {
            const checked = selected === palette.id;
            const chrome = getThemeChrome(palette.id, appearance);
            const logoSrc =
              (chrome.dark ? palette.logos.dark : palette.logos.light) ||
              palette.logos.dark ||
              palette.logos.light;
            return (
              <button
                key={palette.id}
                type="button"
                className={styles.paletteCard}
                role="radio"
                aria-checked={checked}
                onClick={() => updateSettings({ themePalette: palette.id })}
              >
                <span
                  className={styles.palettePreview}
                  style={{ background: chrome.themeColor }}
                  aria-hidden="true"
                >
                  <img
                    src={logoSrc}
                    alt=""
                    className={styles.paletteLogo}
                    decoding="async"
                  />
                </span>
                <span className={styles.paletteName}>{palette.name}</span>
              </button>
            );
          })}
        </div>
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
        <h3 className={styles.sectionTitle}>
          <GlassWater size={18} aria-hidden="true" />
          Botella personal
        </h3>
        <p>Indicá la capacidad de tu botella personal</p>
        <div className={styles.bottleField}>
          <label className={styles.bottleAmount}>
            <span className="sr-only">Capacidad en ml</span>
            <input
              {...NUMBER_FIELD}
              inputMode="decimal"
              value={bottleText}
              onChange={(event) => onBottleChange(event.target.value)}
              placeholder="750"
              aria-invalid={bottleParsed.invalid}
            />
          </label>
          <span className={styles.bottleUnit} aria-hidden="true">
            Ml
          </span>
        </div>
        {bottleParsed.invalid ? (
          <p className={styles.muted}>Ingresá un número válido.</p>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <SpotifyIcon size={18} />
          Spotify
        </h3>
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

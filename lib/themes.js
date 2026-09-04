export const THEME_CLASSIC = "classic";
export const THEME_STONE = "stone";
export const THEME_NEON = "neon";
export const APPEARANCE_LIGHT = "light";
export const APPEARANCE_DARK = "dark";

export const THEME_PALETTES = [
  {
    id: THEME_CLASSIC,
    name: "Arnold Classic",
    swatches: ["#f3f0e9", "#faf8f3", "#b3a598", "#91785d", "#675847"],
    logos: {
      light: "/logo-arnold.svg",
      dark: "/logo-classic-dark-04.svg",
    },
  },
  {
    id: THEME_STONE,
    name: "Arnold Stone",
    swatches: ["#F4F4F1", "#FAFAF8", "#B8B8B1", "#565650", "#393936"],
    logos: {
      light: "/logo-stone-light-04.svg",
      dark: "/logo-stone-dark-04.svg",
    },
  },
  {
    id: THEME_NEON,
    name: "Arnold Neon",
    swatches: ["#111113", "#1B1B1F", "#26262C", "#C7FF3D", "#A970FF"],
    logos: {
      dark: "/logo-neon-dark-04.svg",
    },
  },
];

export function normalizeThemePalette(value) {
  if (value === THEME_STONE) return THEME_STONE;
  if (value === THEME_NEON) return THEME_NEON;
  return THEME_CLASSIC;
}

export function normalizeAppearance(value) {
  return value === APPEARANCE_DARK ? APPEARANCE_DARK : APPEARANCE_LIGHT;
}

export function paletteUsesAppearance(palette) {
  return normalizeThemePalette(palette) !== THEME_NEON;
}

export function getThemeChrome(palette, appearance) {
  const theme = normalizeThemePalette(palette);
  const mode = normalizeAppearance(appearance);
  const dark = theme === THEME_NEON || mode === APPEARANCE_DARK;

  let themeColor = "#F3F0E9";
  if (theme === THEME_NEON) {
    themeColor = "#111113";
  } else if (dark && theme === THEME_STONE) {
    themeColor = "#151515";
  } else if (dark) {
    themeColor = "#171512";
  } else if (theme === THEME_STONE) {
    themeColor = "#F4F4F1";
  }

  return {
    theme,
    appearance: mode,
    dark,
    themeColor,
    colorScheme: dark ? "dark" : "light",
    statusBarStyle: dark ? "black-translucent" : "default",
  };
}

function ensureMeta(name) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  return meta;
}

export function applyThemeAttributes(palette, appearance) {
  if (typeof document === "undefined") {
    return;
  }

  const chrome = getThemeChrome(palette, appearance);
  const root = document.documentElement;
  root.setAttribute("data-theme", chrome.theme);
  root.setAttribute("data-appearance", chrome.appearance);
  root.style.colorScheme = chrome.colorScheme;

  const computedBg = getComputedStyle(root).getPropertyValue("--page-bg").trim();
  const themeColor = computedBg || chrome.themeColor;

  ensureMeta("theme-color").setAttribute("content", themeColor);
  ensureMeta("color-scheme").setAttribute("content", chrome.colorScheme);
  ensureMeta("apple-mobile-web-app-status-bar-style").setAttribute(
    "content",
    chrome.statusBarStyle,
  );
}

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

export function applyThemeAttributes(palette, appearance) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.setAttribute("data-theme", normalizeThemePalette(palette));
  root.setAttribute("data-appearance", normalizeAppearance(appearance));
  const background = getComputedStyle(root).getPropertyValue("--page-bg").trim();
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor && background) {
    themeColor.setAttribute("content", background);
  }
}

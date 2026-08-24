export const THEME_CLASSIC = "classic";
export const THEME_STONE = "stone";

export const THEME_PALETTES = [
  {
    id: THEME_CLASSIC,
    name: "Arnold Classic",
    swatches: ["#f3f0e9", "#faf8f3", "#b3a598", "#91785d", "#675847"],
  },
  {
    id: THEME_STONE,
    name: "Arnold Stone",
    swatches: ["#F4F4F1", "#FAFAF8", "#B8B8B1", "#565650", "#393936"],
  },
];

export function normalizeThemePalette(value) {
  return value === THEME_STONE ? THEME_STONE : THEME_CLASSIC;
}

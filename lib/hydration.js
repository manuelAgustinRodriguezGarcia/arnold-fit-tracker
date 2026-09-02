export const MAX_WATER_ML = 20_000;

export function parseWaterAmount(text) {
  const raw = String(text ?? "").trim();
  if (raw === "" || raw === "," || raw === ".") {
    return { empty: true, invalid: false, value: null };
  }

  const normalized = raw.replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return { empty: false, invalid: true, value: null };
  }

  return { empty: false, invalid: false, value };
}

export function toWaterMl(amount, unit) {
  if (amount == null || !Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const ml = unit === "ml" ? amount : amount * 1000;
  if (!Number.isFinite(ml)) {
    return null;
  }

  return Math.min(MAX_WATER_ML, Math.round(ml));
}

export function fromWaterMl(ml, unit) {
  if (ml == null || !Number.isFinite(ml)) {
    return "";
  }
  if (unit === "ml") {
    return String(Math.round(ml));
  }

  const liters = ml / 1000;
  if (Number.isInteger(liters)) {
    return String(liters);
  }
  return String(Number(liters.toFixed(3)));
}

export function formatWaterMl(ml) {
  if (ml == null || !Number.isFinite(ml)) {
    return "";
  }
  if (ml >= 1000) {
    const liters = ml / 1000;
    const text = Number.isInteger(liters)
      ? String(liters)
      : String(Number(liters.toFixed(3)));
    return `${text.replace(".", ",")} L`;
  }
  return `${Math.round(ml)} ml`;
}

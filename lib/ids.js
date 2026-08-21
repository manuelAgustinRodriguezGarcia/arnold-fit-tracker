export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `arnold-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

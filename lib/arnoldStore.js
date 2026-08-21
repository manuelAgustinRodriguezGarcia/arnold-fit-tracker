import { SEED_ROUTINES } from "@/lib/seedData";
import { CURRENT_VERSION, DEFAULT_STATE, loadAppState, writeState } from "@/lib/storage";

let state = DEFAULT_STATE;
let didLoad = false;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeArnoldStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getArnoldStoreSnapshot() {
  if (!didLoad || state.version !== CURRENT_VERSION) {
    state = loadAppState(SEED_ROUTINES);
    didLoad = true;
  }
  return state;
}

export function getArnoldServerSnapshot() {
  return DEFAULT_STATE;
}

export function updateArnoldStore(updater) {
  const current = getArnoldStoreSnapshot();
  const next = typeof updater === "function" ? updater(current) : updater;
  if (next === current) {
    return current;
  }
  state = next;
  writeState(next);
  emit();
  return next;
}

const STORAGE_KEY = "arnold:v1";
export const CURRENT_VERSION = 2;

export const DEFAULT_STATE = {
  version: CURRENT_VERSION,
  routines: [],
  sessions: [],
  activeWorkout: null,
  settings: {},
};

const MIGRATIONS = {
  1: (state) => ({
    ...state,
    sessions: [],
    version: 2,
  }),
};

export function migrateState(state) {
  if (!state || typeof state !== "object") {
    return { ...DEFAULT_STATE };
  }

  let current = {
    ...DEFAULT_STATE,
    ...state,
    routines: Array.isArray(state.routines) ? state.routines : [],
    sessions: Array.isArray(state.sessions) ? state.sessions : [],
    activeWorkout: state.activeWorkout ?? null,
    settings:
      state.settings && typeof state.settings === "object" ? state.settings : {},
  };

  if (typeof current.version !== "number") {
    current.version = 1;
  }

  while (current.version < CURRENT_VERSION) {
    const migrate = MIGRATIONS[current.version];
    if (typeof migrate !== "function") {
      current = { ...current, version: CURRENT_VERSION };
      break;
    }
    current = migrate(current);
  }

  return current;
}

export function isValidState(state) {
  return Boolean(
    state &&
      typeof state === "object" &&
      typeof state.version === "number" &&
      Array.isArray(state.routines) &&
      Array.isArray(state.sessions) &&
      (state.activeWorkout === null || typeof state.activeWorkout === "object") &&
      state.settings &&
      typeof state.settings === "object",
  );
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readState() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const migrated = migrateState(parsed);
    if (!isValidState(migrated)) {
      return { ...DEFAULT_STATE };
    }
    if (migrated.version !== parsed.version) {
      writeState(migrated);
    }
    return migrated;
  } catch (error) {
    console.error("Arnold: no se pudo leer localStorage", error);
    return { ...DEFAULT_STATE };
  }
}

export function writeState(state) {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Arnold: no se pudo escribir localStorage", error);
    return false;
  }
}

export function loadAppState(seedRoutines) {
  if (!canUseLocalStorage()) {
    return { ...DEFAULT_STATE };
  }

  const existing = readState();
  if (existing === null) {
    const initial = {
      ...DEFAULT_STATE,
      routines: seedRoutines,
    };
    writeState(initial);
    return initial;
  }

  return existing;
}

import {
  applyNamedMigrations,
  BACKUP_KEY,
  needsNamedMigration,
  normalizeStateShape,
} from "./migrations";

const STORAGE_KEY = "arnold:v1";
export const CURRENT_VERSION = 2;

export const DEFAULT_STATE = {
  version: CURRENT_VERSION,
  exercises: [],
  routines: [],
  sessions: [],
  activeWorkout: null,
  settings: {},
  migrationsApplied: [],
};

const MIGRATIONS = {
  1: (state) => ({
    ...state,
    version: 2,
  }),
};

export function migrateState(state) {
  if (!state || typeof state !== "object") {
    return { ...DEFAULT_STATE };
  }

  let current = normalizeStateShape({
    ...DEFAULT_STATE,
    ...state,
  });

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

  return applyNamedMigrations(current);
}

export function isValidState(state) {
  return Boolean(
    state &&
      typeof state === "object" &&
      typeof state.version === "number" &&
      Array.isArray(state.exercises) &&
      Array.isArray(state.routines) &&
      Array.isArray(state.sessions) &&
      Array.isArray(state.migrationsApplied) &&
      (state.activeWorkout === null || typeof state.activeWorkout === "object") &&
      state.settings &&
      typeof state.settings === "object",
  );
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function backupStateIfNeeded(raw) {
  if (!canUseLocalStorage() || !raw) {
    return;
  }

  try {
    if (window.localStorage.getItem(BACKUP_KEY) === null) {
      window.localStorage.setItem(BACKUP_KEY, typeof raw === "string" ? raw : JSON.stringify(raw));
    }
  } catch (error) {
    console.error("Arnold: no se pudo respaldar localStorage", error);
  }
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
    if (needsNamedMigration(parsed) || parsed.version !== CURRENT_VERSION) {
      backupStateIfNeeded(raw);
    }
    try {
      const migrated = migrateState(parsed);
      if (!isValidState(migrated)) {
        return normalizeStateShape(parsed);
      }
      const appliedChanged =
        JSON.stringify(migrated.migrationsApplied || []) !==
        JSON.stringify(parsed.migrationsApplied || []);
      if (migrated.version !== parsed.version || appliedChanged) {
        writeState(migrated);
      }
      return migrated;
    } catch (migrationError) {
      console.error("Arnold: no se pudo migrar localStorage", migrationError);
      return normalizeStateShape(parsed);
    }
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

export function loadAppState(seedRoutines, seedExercises = []) {
  if (!canUseLocalStorage()) {
    return { ...DEFAULT_STATE };
  }

  const existing = readState();
  if (existing === null) {
    const initial = migrateState({
      ...DEFAULT_STATE,
      routines: seedRoutines,
      exercises: seedExercises,
    });
    writeState(initial);
    return initial;
  }

  return existing;
}

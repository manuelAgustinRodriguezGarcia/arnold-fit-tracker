import { CATALOG_EXERCISES } from "./seedData";
import {
  createExerciseRecord,
  DEFAULT_REST_SECONDS,
  EXERCISE_TYPE,
  findExerciseById,
  findExerciseByName,
  namesMatch,
  parseExerciseDetails,
} from "./exercises";
import { isSameLocalDate } from "./dates";
import { createSetsFromExercise, createSet } from "./workoutSets";
import { FATIGUE, toLegacySnapshotExercise, upgradeActiveWorkout } from "./workout";
import { normalizeAppearance, normalizeThemePalette } from "./themes";

export const MIGRATION_EXERCISE_LIBRARY = "v3-exercise-library";
export const MIGRATION_SESSION_2026_08_21 = "v2-session-2026-08-21";
export const MIGRATION_SESSION_2026_08_21_REAL = "history-2026-08-21-real-workout";
export const MIGRATION_STRETCH_PRESETS = "stretch-presets-v1";
export const BACKUP_KEY = "arnold:v1:backup-pre-v3";

const SESSION_2026_08_21 = [
  { name: "Press banca plana con barra olímpica", catalogId: "ex-press-banca-plana", sets: 3, reps: 15 },
  { name: "Press inclinado de pecho con mancuerna", catalogId: "ex-press-inclinado-mancuerna", sets: 3, reps: 20 },
  { name: "Apertura de pecho", catalogId: "ex-apertura-pecho", sets: 3, reps: 20 },
  { name: "Tríceps en poleas", catalogId: "ex-triceps-poleas", sets: 3, reps: 30 },
  { name: "Fondo de tríceps", catalogId: "ex-fondo-triceps", sets: 3, reps: 10 },
];

const REAL_WORKOUT_2026_08_21 = [
  {
    catalogId: "ex-press-banca-plana",
    name: "Press banca plana con barra olímpica",
    type: EXERCISE_TYPE.REPS,
    defaultSets: 3,
    defaultReps: { min: 15, max: 15 },
    defaultWeightKg: 50,
    sets: [
      { number: 1, reps: 15, weightKg: 50 },
      { number: 2, reps: 15, weightKg: 50 },
      { number: 3, reps: 15, weightKg: 50 },
    ],
  },
  {
    catalogId: "ex-press-inclinado-mancuerna",
    name: "Press inclinado de pecho con mancuerna",
    type: EXERCISE_TYPE.REPS,
    defaultSets: 3,
    defaultReps: { min: 20, max: 20 },
    defaultWeightKg: 14,
    sets: [
      { number: 1, reps: 20, weightKg: 14 },
      { number: 2, reps: 20, weightKg: 14 },
      { number: 3, reps: 20, weightKg: 14 },
    ],
  },
  {
    catalogId: "ex-apertura-pecho",
    name: "Apertura de pecho",
    type: EXERCISE_TYPE.REPS,
    defaultSets: 3,
    defaultReps: { min: 20, max: 20 },
    defaultWeightKg: 85,
    sets: [
      { number: 1, reps: 20, weightKg: 85 },
      { number: 2, reps: 20, weightKg: 85 },
      { number: 3, reps: 20, weightKg: 85 },
    ],
  },
  {
    catalogId: "ex-triceps-poleas",
    name: "Tríceps en poleas",
    type: EXERCISE_TYPE.REPS,
    defaultSets: 3,
    defaultReps: { min: 30, max: 30 },
    defaultWeightKg: 15,
    sets: [
      { number: 1, reps: 30, weightKg: 15 },
      { number: 2, reps: 30, weightKg: 15 },
      { number: 3, reps: 30, weightKg: 15 },
    ],
  },
  {
    catalogId: "ex-fondo-triceps",
    name: "Fondo de tríceps",
    type: EXERCISE_TYPE.REPS,
    defaultSets: 3,
    defaultReps: { min: 10, max: 10 },
    defaultWeightKg: null,
    sets: [
      { number: 1, reps: 10, weightKg: null },
      { number: 2, reps: 10, weightKg: null },
      { number: 3, reps: 10, weightKg: null },
    ],
  },
  {
    catalogId: "ex-cardio-final",
    name: "Cardio final",
    type: EXERCISE_TYPE.TIMED,
    defaultSets: 1,
    defaultDurationSeconds: 1800,
    defaultWeightKg: null,
    sets: [
      { number: 1, durationSeconds: 1800 },
    ],
  },
];

const CARDIO_LIBRARY_EXERCISE = createExerciseRecord({
  id: "ex-cardio-final",
  name: "Cardio final",
  type: EXERCISE_TYPE.TIMED,
  defaultSets: 1,
  defaultDurationSeconds: 1800,
  durationRange: { min: 1800, max: 1800 },
  restSeconds: 0,
});

function upsertLibraryExercise(exercises, incoming) {
  const byId = incoming.id ? findExerciseById(exercises, incoming.id) : null;
  if (byId) {
    return { exercises, id: byId.id };
  }
  const byName = findExerciseByName(exercises, incoming.name);
  if (byName) {
    return { exercises, id: byName.id };
  }
  return {
    exercises: [...exercises, incoming],
    id: incoming.id,
  };
}

function ensureCatalog(exercises) {
  let next = [...exercises];
  for (const item of CATALOG_EXERCISES) {
    const result = upsertLibraryExercise(next, item);
    next = result.exercises;
  }
  return next;
}

function migrateRoutineExercise(item, index, exercises) {
  if (item?.exerciseId && findExerciseById(exercises, item.exerciseId)) {
    return {
      exercises,
      entry: { exerciseId: item.exerciseId, order: item.order ?? index },
    };
  }

  const name = item?.name || "";
  const parsed = parseExerciseDetails(item?.details);
  const matched = findExerciseByName(exercises, name);
  if (matched) {
    return {
      exercises,
      entry: { exerciseId: matched.id, order: item.order ?? index },
    };
  }

  const created = createExerciseRecord({
    id: item?.id ? `ex-legacy-${item.id}` : undefined,
    name,
    type: parsed.parsed ? parsed.type : EXERCISE_TYPE.REPS,
    defaultSets: parsed.defaultSets || 3,
    defaultReps: parsed.defaultReps,
    defaultDurationSeconds: parsed.defaultDurationSeconds,
    durationRange: parsed.durationRange,
    restSeconds: DEFAULT_REST_SECONDS,
    imagePath: item?.imagePath || null,
    notes: parsed.notes,
  });
  const result = upsertLibraryExercise(exercises, created);
  return {
    exercises: result.exercises,
    entry: { exerciseId: result.id, order: item.order ?? index },
  };
}

function recoverWeightFromExercise(exercise) {
  if (!exercise) {
    return null;
  }
  if (exercise.defaultWeightKg != null) {
    return exercise.defaultWeightKg;
  }
  if (Array.isArray(exercise.sets)) {
    const found = exercise.sets.find((set) => set.weightKg != null);
    return found?.weightKg ?? null;
  }
  return exercise.weightKg ?? null;
}

function snapshotFromLegacyExercise(item, library, completedAt) {
  const matched = findExerciseByName(library, item.name) || findExerciseById(library, item.id);
  const parsed = parseExerciseDetails(item.details);
  const base = matched || createExerciseRecord({
    id: item.id,
    name: item.name,
    type: parsed.parsed ? parsed.type : EXERCISE_TYPE.REPS,
    defaultSets: parsed.defaultSets,
    defaultReps: parsed.defaultReps,
    defaultDurationSeconds: parsed.defaultDurationSeconds,
    durationRange: parsed.durationRange,
    notes: parsed.notes || item.details || null,
    imagePath: item.imagePath || null,
  });
  const weightKg = recoverWeightFromExercise(item);
  const sets = createSetsFromExercise(base).map((set) => ({
    ...set,
    weightKg: weightKg ?? set.weightKg,
    completed: true,
    completedAt,
  }));

  return {
    workoutExerciseId: `we-legacy-${item.id || base.id}`,
    exerciseId: base.id,
    name: item.name || base.name,
    type: base.type,
    restSeconds: base.restSeconds,
    imagePath: item.imagePath || base.imagePath || null,
    notes: item.details || base.notes || null,
    defaultSets: base.defaultSets,
    defaultReps: base.defaultReps,
    defaultWeightKg: weightKg,
    defaultDurationSeconds: base.defaultDurationSeconds,
    durationRange: base.durationRange,
    order: item.order ?? 0,
    sets,
  };
}

function migrateSessionSnapshot(session, library) {
  if (Array.isArray(session.exercises) && session.exercises.some((item) => item.sets)) {
    return session;
  }

  const source = session.routineSnapshot?.exercises || [];
  const completedAt = session.endedAt || session.startedAt;
  const exercises = source.map((item, index) => ({
    ...snapshotFromLegacyExercise(item, library, completedAt),
    order: index,
  }));

  return {
    ...session,
    exercises,
    exerciseCount: session.exerciseCount ?? exercises.length,
    routineSnapshot: {
      ...(session.routineSnapshot || {}),
      exercises: exercises.map((exercise, index) => toLegacySnapshotExercise(exercise, index)),
    },
  };
}

function migrateExerciseLibrary(state) {
  let exercises = ensureCatalog(Array.isArray(state.exercises) ? state.exercises : []);

  const routines = (state.routines || []).map((routine) => {
    const nextEntries = [];
    (routine.exercises || []).forEach((item, index) => {
      const result = migrateRoutineExercise(item, index, exercises);
      exercises = result.exercises;
      nextEntries.push(result.entry);
    });
    return {
      ...routine,
      exercises: nextEntries,
    };
  });

  const sessions = (state.sessions || []).map((session) =>
    migrateSessionSnapshot(session, exercises),
  );

  return {
    ...state,
    exercises,
    routines,
    sessions,
  };
}

function findSessionOnDate(sessions, year, month, day) {
  return (sessions || []).find((session) =>
    isSameLocalDate(session.startedAt || session.endedAt, year, month, day) ||
    isSameLocalDate(session.endedAt || session.startedAt, year, month, day),
  );
}

function ensureRealWorkoutLibrary(exercises) {
  let next = [...exercises];
  for (const item of REAL_WORKOUT_2026_08_21) {
    const existing =
      findExerciseById(next, item.catalogId) || findExerciseByName(next, item.name);
    if (existing) {
      continue;
    }
    const created =
      item.catalogId === "ex-cardio-final"
        ? CARDIO_LIBRARY_EXERCISE
        : createExerciseRecord({
            id: item.catalogId,
            name: item.name,
            type: item.type,
            defaultSets: item.defaultSets,
            defaultReps: item.defaultReps,
            defaultWeightKg: item.defaultWeightKg,
            defaultDurationSeconds: item.defaultDurationSeconds,
            restSeconds: item.type === EXERCISE_TYPE.TIMED ? 0 : DEFAULT_REST_SECONDS,
          });
    const result = upsertLibraryExercise(next, created);
    next = result.exercises;
  }
  return next;
}

function buildRealWorkoutExercises(library) {
  return REAL_WORKOUT_2026_08_21.map((item, index) => {
    const matched =
      findExerciseById(library, item.catalogId) || findExerciseByName(library, item.name);
    const timed = item.type === EXERCISE_TYPE.TIMED;
    const sets = item.sets.map((set) =>
      createSet({
        id: `set-2026-08-21-real-${index + 1}-${set.number}`,
        number: set.number,
        reps: timed ? null : set.reps,
        weightKg: timed ? null : set.weightKg ?? null,
        durationSeconds: timed ? set.durationSeconds : null,
        completed: true,
        completedAt: null,
      }),
    );

    return {
      workoutExerciseId: `we-2026-08-21-real-${index + 1}`,
      exerciseId: matched?.id || item.catalogId,
      name: item.name,
      type: item.type,
      restSeconds: timed ? null : matched?.restSeconds ?? DEFAULT_REST_SECONDS,
      imagePath: matched?.imagePath || null,
      notes: null,
      defaultSets: item.defaultSets,
      defaultReps: timed ? null : item.defaultReps,
      defaultWeightKg: timed ? null : item.defaultWeightKg ?? null,
      defaultDurationSeconds: timed ? item.defaultDurationSeconds : null,
      durationRange: timed ? { min: 1800, max: 1800 } : null,
      order: index,
      sets,
    };
  });
}

function getRealWorkoutBounds() {
  const started = new Date(2026, 7, 21, 13, 16, 0, 0);
  const ended = new Date(started.getTime() + 6600 * 1000);
  return { started, ended };
}

function hasRealWorkoutStartTime(session) {
  if (!session?.startedAt) {
    return false;
  }
  const date = new Date(session.startedAt);
  return (
    date.getFullYear() === 2026 &&
    date.getMonth() === 7 &&
    date.getDate() === 21 &&
    date.getHours() === 13 &&
    date.getMinutes() === 16
  );
}

function hasRealWorkoutSnapshot(session) {
  const exercises = session?.exercises || [];
  if (Number(session?.durationSeconds) !== 6600 || exercises.length !== 6) {
    return false;
  }

  const expected = [
    { name: "Press banca plana con barra olímpica", reps: 15, weightKg: 50, count: 3 },
    { name: "Press inclinado de pecho con mancuerna", reps: 20, weightKg: 14, count: 3 },
    { name: "Apertura de pecho", reps: 20, weightKg: 85, count: 3 },
    { name: "Tríceps en poleas", reps: 30, weightKg: 15, count: 3 },
    { name: "Fondo de tríceps", reps: 10, weightKg: null, count: 3 },
    { name: "Cardio final", durationSeconds: 1800, count: 1 },
  ];

  return expected.every((item, index) => {
    const exercise = exercises[index];
    if (!exercise || !namesMatch(exercise.name, item.name)) {
      return false;
    }
    const sets = exercise.sets || [];
    if (sets.length !== item.count || !sets.every((set) => set.completed)) {
      return false;
    }
    if (item.durationSeconds != null) {
      return sets.every((set) => set.durationSeconds === item.durationSeconds);
    }
    return sets.every(
      (set) => set.reps === item.reps && set.weightKg === item.weightKg,
    );
  });
}

function createRealWorkoutSession(state, exercises) {
  const { started, ended } = getRealWorkoutBounds();
  const routine =
    (state.routines || []).find((item) => item.id === "seed-pecho-triceps") ||
    (state.routines || []).find((item) => /pecho/i.test(item.name));

  return {
    id: "session-2026-08-21",
    routineId: routine?.id || null,
    routineName: routine?.name || "Pecho + tríceps",
    routineSnapshot: {
      name: routine?.name || "Pecho + tríceps",
      description: routine?.description || "",
      exercises: exercises.map((exercise, index) =>
        toLegacySnapshotExercise(exercise, index),
      ),
    },
    exercises,
    startedAt: started.toISOString(),
    endedAt: ended.toISOString(),
    durationSeconds: 6600,
    exerciseCount: 6,
    fatigue: FATIGUE.TIRED,
  };
}

function applyRealWorkout20260821(state) {
  const exercisesLibrary = ensureRealWorkoutLibrary(state.exercises || []);
  const snapshot = buildRealWorkoutExercises(exercisesLibrary);
  const existing = findSessionOnDate(state.sessions, 2026, 8, 21);

  if (
    existing &&
    hasRealWorkoutSnapshot(existing) &&
    hasRealWorkoutStartTime(existing) &&
    existing.durationSeconds === 6600 &&
    existing.fatigue === FATIGUE.TIRED
  ) {
    return {
      ...state,
      exercises: exercisesLibrary,
    };
  }

  if (existing) {
    const { started, ended } = getRealWorkoutBounds();
    return {
      ...state,
      exercises: exercisesLibrary,
      sessions: state.sessions.map((session) =>
        session.id === existing.id
          ? {
              ...session,
              startedAt: started.toISOString(),
              endedAt: ended.toISOString(),
              durationSeconds: 6600,
              exerciseCount: 6,
              fatigue: FATIGUE.TIRED,
              exercises: snapshot,
              routineSnapshot: {
                ...(session.routineSnapshot || {}),
                name: session.routineSnapshot?.name || session.routineName,
                description: session.routineSnapshot?.description || "",
                exercises: snapshot.map((exercise, index) =>
                  toLegacySnapshotExercise(exercise, index),
                ),
              },
            }
          : session,
      ),
    };
  }

  return {
    ...state,
    exercises: exercisesLibrary,
    sessions: [createRealWorkoutSession(state, snapshot), ...(state.sessions || [])],
  };
}

function migrateSession20260821(state) {
  const session = findSessionOnDate(state.sessions, 2026, 8, 21);
  if (!session) {
    return state;
  }

  const completedAt = session.endedAt || session.startedAt;
  const previous = [
    ...(session.exercises || []),
    ...(session.routineSnapshot?.exercises || []),
  ];

  const exercises = SESSION_2026_08_21.map((item, index) => {
    const library = findExerciseById(state.exercises, item.catalogId);
    const previousMatch = previous.find((entry) => namesMatch(entry.name, item.name));
    const weightKg = recoverWeightFromExercise(previousMatch);
    const sets = Array.from({ length: item.sets }, (_, setIndex) =>
      createSet({
        id: `set-2026-08-21-${index + 1}-${setIndex + 1}`,
        number: setIndex + 1,
        reps: item.reps,
        weightKg,
        completed: true,
        completedAt,
      }),
    );

    return {
      workoutExerciseId: `we-2026-08-21-${index + 1}`,
      exerciseId: library?.id || item.catalogId,
      name: item.name,
      type: EXERCISE_TYPE.REPS,
      restSeconds: library?.restSeconds ?? DEFAULT_REST_SECONDS,
      imagePath: library?.imagePath || previousMatch?.imagePath || null,
      notes: previousMatch?.details || previousMatch?.notes || `${item.sets} × ${item.reps}`,
      defaultSets: item.sets,
      defaultReps: { min: item.reps, max: item.reps },
      defaultWeightKg: weightKg,
      defaultDurationSeconds: null,
      durationRange: null,
      order: index,
      sets,
    };
  });

  return {
    ...state,
    sessions: state.sessions.map((item) =>
      item.id === session.id
        ? {
            ...item,
            exercises,
            exerciseCount: exercises.length,
            routineSnapshot: {
              ...(item.routineSnapshot || {}),
              name: item.routineSnapshot?.name || item.routineName,
              description: item.routineSnapshot?.description || "",
              exercises: exercises.map((exercise, index) =>
                toLegacySnapshotExercise(exercise, index),
              ),
            },
          }
        : item,
    ),
  };
}

function migrateStretchPresets(state) {
  const missing = CATALOG_EXERCISES.filter(
    (exercise) =>
      String(exercise.id).startsWith("ex-elong-") &&
      !findExerciseById(state.exercises, exercise.id),
  );
  if (missing.length === 0) {
    return state;
  }
  return {
    ...state,
    exercises: [...state.exercises, ...missing],
  };
}

export function normalizeStateShape(state) {
  return {
    version: typeof state?.version === "number" ? state.version : 2,
    exercises: Array.isArray(state?.exercises) ? state.exercises : [],
    routines: Array.isArray(state?.routines) ? state.routines : [],
    sessions: Array.isArray(state?.sessions) ? state.sessions : [],
    activeWorkout: state?.activeWorkout ?? null,
    settings: {
      ...(state?.settings && typeof state.settings === "object" ? state.settings : {}),
      themePalette: normalizeThemePalette(state?.settings?.themePalette),
      appearance: normalizeAppearance(state?.settings?.appearance),
    },
    migrationsApplied: Array.isArray(state?.migrationsApplied)
      ? state.migrationsApplied
      : [],
  };
}

export function applyNamedMigrations(state) {
  let current = normalizeStateShape(state);
  const applied = new Set(current.migrationsApplied);

  if (!applied.has(MIGRATION_EXERCISE_LIBRARY)) {
    current = migrateExerciseLibrary(current);
    applied.add(MIGRATION_EXERCISE_LIBRARY);
  }

  if (!applied.has(MIGRATION_SESSION_2026_08_21)) {
    current = migrateSession20260821(current);
    applied.add(MIGRATION_SESSION_2026_08_21);
  }

  const session20260821 = findSessionOnDate(current.sessions, 2026, 8, 21);
  if (!applied.has(MIGRATION_SESSION_2026_08_21_REAL)) {
    current = applyRealWorkout20260821(current);
    applied.add(MIGRATION_SESSION_2026_08_21_REAL);
  } else if (
    session20260821 &&
    (!hasRealWorkoutSnapshot(session20260821) ||
      !hasRealWorkoutStartTime(session20260821) ||
      session20260821.fatigue !== FATIGUE.TIRED)
  ) {
    current = applyRealWorkout20260821(current);
  }

  if (!applied.has(MIGRATION_STRETCH_PRESETS)) {
    current = migrateStretchPresets(current);
    applied.add(MIGRATION_STRETCH_PRESETS);
  }

  current.migrationsApplied = Array.from(applied);
  current.activeWorkout = upgradeActiveWorkout(current.activeWorkout);
  return current;
}

export function needsNamedMigration(state) {
  const applied = state?.migrationsApplied || [];
  return (
    !applied.includes(MIGRATION_EXERCISE_LIBRARY) ||
    !applied.includes(MIGRATION_SESSION_2026_08_21) ||
    !applied.includes(MIGRATION_SESSION_2026_08_21_REAL) ||
    !applied.includes(MIGRATION_STRETCH_PRESETS)
  );
}

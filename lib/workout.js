import { createId } from "./ids";
import { nowIso } from "./dates";
import {
  EXERCISE_TYPE,
  formatReps,
  formatSeconds,
  normalizeName,
  parseExerciseDetails,
  resolveRoutineExercises,
} from "./exercises";
import { isStretchExercise } from "./stretchPresets";
import {
  completeSet,
  createSet,
  createSetsFromExercise,
  getCompletedSets,
  getMinSetCount,
  getNextIncompleteSet,
  isExerciseComplete,
  resizeSets,
  toggleSetCompleted,
  updateSetFields,
} from "./workoutSets";

export const WORKOUT_STATUS = {
  RUNNING: "running",
  PAUSED: "paused",
};

export const FATIGUE = {
  VERY_TIRED: "very_tired",
  TIRED: "tired",
  REGULAR: "regular",
};

export function getFatigueLabel(value) {
  switch (value) {
    case FATIGUE.VERY_TIRED:
      return "Muy cansado";
    case FATIGUE.TIRED:
      return "Cansado";
    case FATIGUE.REGULAR:
      return "Regular";
    default:
      return "Sin dato";
  }
}

export function createWorkoutExercise(exercise, order = 0) {
  return {
    workoutExerciseId: createId(),
    exerciseId: exercise.id || exercise.exerciseId || null,
    name: exercise.name,
    type: exercise.type === EXERCISE_TYPE.TIMED ? EXERCISE_TYPE.TIMED : EXERCISE_TYPE.REPS,
    restSeconds: exercise.restSeconds ?? 90,
    imagePath: exercise.imagePath || null,
    notes: exercise.notes || null,
    defaultSets: exercise.defaultSets,
    defaultReps: exercise.defaultReps || null,
    defaultWeightKg: exercise.defaultWeightKg ?? null,
    defaultDurationSeconds: exercise.defaultDurationSeconds ?? null,
    durationRange: exercise.durationRange || null,
    order,
    sets: createSetsFromExercise(exercise),
  };
}

export function toLegacySnapshotExercise(exercise, index) {
  const sets = exercise.sets || [];
  const completed = getCompletedSets(exercise);
  const source = completed.length > 0 ? completed : sets;
  let details = exercise.notes || "";

  if (exercise.type === EXERCISE_TYPE.TIMED) {
    const duration = source[0]?.durationSeconds ?? exercise.defaultDurationSeconds;
    details = `${sets.length} × ${formatSeconds(duration)}`;
  } else if (source.length > 0) {
    const firstReps = source[0]?.reps;
    const sameReps = source.every((set) => set.reps === firstReps);
    details = sameReps
      ? `${sets.length} × ${firstReps ?? formatReps(exercise.defaultReps)}`
      : source.map((set) => set.reps ?? "—").join(" / ");
  }

  return {
    id: exercise.exerciseId || exercise.workoutExerciseId || exercise.id,
    name: exercise.name,
    details,
    imagePath: exercise.imagePath || null,
    order: exercise.order ?? index,
  };
}

export function snapshotRoutine(routine, library = []) {
  const resolved = resolveRoutineExercises(routine, library);
  return {
    name: routine.name,
    description: routine.description || "",
    exercises: resolved.map((exercise, index) => toLegacySnapshotExercise(exercise, index)),
  };
}

export function createActiveWorkout(routine, library = [], startedAt = new Date()) {
  const resolved = resolveRoutineExercises(routine, library);
  const exercises = resolved.map((exercise, index) => createWorkoutExercise(exercise, index));

  return {
    id: createId(),
    routineId: routine.id,
    routineName: routine.name,
    currentExerciseId: null,
    exercises,
    routineSnapshot: snapshotRoutine(routine, library),
    startedAt: nowIso(startedAt),
    pausedAt: null,
    accumulatedPausedMilliseconds: 0,
    status: WORKOUT_STATUS.RUNNING,
    restTimer: null,
    timedTimer: null,
    timedTimers: {},
    pausedTimedSetId: null,
  };
}

export function getWorkoutExercise(workout, workoutExerciseId) {
  return (workout?.exercises || []).find(
    (exercise) => exercise.workoutExerciseId === workoutExerciseId,
  ) || null;
}

export function getCurrentExercise(workout) {
  if (!workout) {
    return null;
  }
  return getWorkoutExercise(workout, workout.currentExerciseId);
}

export function setCurrentExercise(workout, workoutExerciseId) {
  if (!workout) {
    return workout;
  }
  return {
    ...workout,
    currentExerciseId: workoutExerciseId || null,
  };
}

export function mapWorkoutExercise(workout, workoutExerciseId, updater) {
  return {
    ...workout,
    exercises: (workout.exercises || []).map((exercise) =>
      exercise.workoutExerciseId === workoutExerciseId ? updater(exercise) : exercise,
    ),
  };
}

export function pauseWorkout(workout, pausedAt = new Date()) {
  if (!workout || workout.status === WORKOUT_STATUS.PAUSED) {
    return workout;
  }

  const frozen = freezeTimedTimer(workout, pausedAt);
  const ts = pausedAt.getTime();
  return {
    ...frozen,
    status: WORKOUT_STATUS.PAUSED,
    pausedAt: nowIso(pausedAt),
    elapsedMilliseconds: getElapsedMilliseconds(
      { ...frozen, status: WORKOUT_STATUS.RUNNING, pausedAt: null },
      ts,
    ),
  };
}

export function resumeWorkout(workout, resumedAt = new Date()) {
  if (!workout || workout.status !== WORKOUT_STATUS.PAUSED || !workout.pausedAt) {
    return {
      ...workout,
      status: WORKOUT_STATUS.RUNNING,
      pausedAt: null,
    };
  }

  const pauseDuration = Math.max(
    0,
    resumedAt.getTime() - new Date(workout.pausedAt).getTime(),
  );

  let next = {
    ...workout,
    status: WORKOUT_STATUS.RUNNING,
    pausedAt: null,
    elapsedMilliseconds: null,
    accumulatedPausedMilliseconds:
      (workout.accumulatedPausedMilliseconds || 0) + pauseDuration,
  };

  const pausedSetId = next.pausedTimedSetId;
  const saved = pausedSetId ? next.timedTimers?.[pausedSetId] : null;
  if (saved?.workoutExerciseId && saved.setId) {
    next = startTimedSet(next, saved.workoutExerciseId, saved.setId, resumedAt);
  }

  return {
    ...next,
    pausedTimedSetId: null,
  };
}

export function getElapsedMilliseconds(workout, now = Date.now()) {
  if (!workout) {
    return 0;
  }

  if (
    workout.status === WORKOUT_STATUS.PAUSED &&
    typeof workout.elapsedMilliseconds === "number"
  ) {
    return Math.max(0, workout.elapsedMilliseconds);
  }

  const startedAt = new Date(workout.startedAt).getTime();
  const paused = workout.accumulatedPausedMilliseconds || 0;
  const end =
    workout.status === WORKOUT_STATUS.PAUSED && workout.pausedAt
      ? new Date(workout.pausedAt).getTime()
      : now;

  return Math.max(0, end - startedAt - paused);
}

export function getTimerRemainingMs(timer, now = Date.now()) {
  if (!timer?.endsAt) {
    return 0;
  }
  return Math.max(0, new Date(timer.endsAt).getTime() - now);
}

export function shouldStartRest(exercise) {
  return Boolean(exercise && Number(exercise.restSeconds) > 0);
}

export function startRest(workout, workoutExerciseId, now = new Date()) {
  const exercise = getWorkoutExercise(workout, workoutExerciseId);
  if (!exercise || !shouldStartRest(exercise)) {
    return {
      ...workout,
      restTimer: null,
    };
  }

  return {
    ...workout,
    restTimer: {
      workoutExerciseId,
      startedAt: nowIso(now),
      endsAt: new Date(now.getTime() + exercise.restSeconds * 1000).toISOString(),
    },
  };
}

export function adjustRestTimer(workout, deltaSeconds, now = new Date()) {
  if (!workout?.restTimer) {
    return workout;
  }

  const nextEnds = new Date(workout.restTimer.endsAt).getTime() + deltaSeconds * 1000;
  if (nextEnds <= now.getTime()) {
    return {
      ...workout,
      restTimer: null,
    };
  }

  return {
    ...workout,
    restTimer: {
      ...workout.restTimer,
      endsAt: new Date(nextEnds).toISOString(),
    },
  };
}

export function skipRest(workout) {
  if (!workout) {
    return workout;
  }
  return {
    ...workout,
    restTimer: null,
  };
}

export function clearExpiredRest(workout, now = Date.now()) {
  if (!workout?.restTimer) {
    return workout;
  }
  if (getTimerRemainingMs(workout.restTimer, now) > 0) {
    return workout;
  }
  return {
    ...workout,
    restTimer: null,
  };
}

function getTimedTimerMap(workout) {
  return { ...(workout?.timedTimers || {}) };
}

function clearTimedTimerEntry(timedTimers, setId) {
  if (!setId || !(setId in timedTimers)) {
    return timedTimers;
  }
  const next = { ...timedTimers };
  delete next[setId];
  return next;
}

export function freezeTimedTimer(workout, now = new Date()) {
  const timer = workout?.timedTimer;
  if (!timer?.endsAt) {
    return workout;
  }

  const remainingMs = getTimerRemainingMs(timer, now.getTime());
  const timedTimers = getTimedTimerMap(workout);
  if (remainingMs > 0) {
    timedTimers[timer.setId] = {
      workoutExerciseId: timer.workoutExerciseId,
      setId: timer.setId,
      remainingMs,
      startedAt: timer.startedAt,
    };
  } else {
    delete timedTimers[timer.setId];
  }

  return {
    ...workout,
    timedTimer: null,
    timedTimers,
    pausedTimedSetId: timer.setId,
  };
}

export function clearExerciseTimedTimers(workout, workoutExerciseId) {
  if (!workout || !workoutExerciseId) {
    return workout;
  }

  const timedTimers = getTimedTimerMap(workout);
  for (const [setId, entry] of Object.entries(timedTimers)) {
    if (entry?.workoutExerciseId === workoutExerciseId) {
      delete timedTimers[setId];
    }
  }

  const timedTimer =
    workout.timedTimer?.workoutExerciseId === workoutExerciseId
      ? null
      : workout.timedTimer;

  return {
    ...workout,
    timedTimer,
    timedTimers,
    pausedTimedSetId:
      workout.timedTimer?.workoutExerciseId === workoutExerciseId
        ? null
        : workout.pausedTimedSetId ?? null,
  };
}

export function startTimedSet(workout, workoutExerciseId, setId, now = new Date()) {
  const exercise = getWorkoutExercise(workout, workoutExerciseId);
  const set = exercise?.sets?.find((item) => item.id === setId);
  if (!workout || !set || set.completed) {
    return workout;
  }

  const nowMs = now.getTime();
  const current = workout.timedTimer;
  if (current?.setId === setId && current.endsAt && new Date(current.endsAt).getTime() > nowMs) {
    return setCurrentExercise(workout, workoutExerciseId);
  }

  let next = workout;
  if (current?.setId && current.setId !== setId && current.endsAt) {
    next = freezeTimedTimer(next, now);
  }

  const saved = next.timedTimers?.[setId];
  const remainingMs =
    Number(saved?.remainingMs) > 0
      ? saved.remainingMs
      : Math.max(1, Number(set.durationSeconds) || 60) * 1000;

  return {
    ...next,
    currentExerciseId: workoutExerciseId,
    pausedTimedSetId: null,
    timedTimer: {
      workoutExerciseId,
      setId,
      startedAt: nowIso(now),
      endsAt: new Date(nowMs + remainingMs).toISOString(),
    },
    timedTimers: getTimedTimerMap(next),
  };
}

export function clearTimedTimer(workout, setId) {
  if (!workout) {
    return workout;
  }

  const targetId = setId || workout.timedTimer?.setId;
  const timedTimer =
    !targetId || workout.timedTimer?.setId === targetId ? null : workout.timedTimer;

  return {
    ...workout,
    timedTimer,
    timedTimers: clearTimedTimerEntry(getTimedTimerMap(workout), targetId),
    pausedTimedSetId:
      targetId && workout.pausedTimedSetId === targetId ? null : workout.pausedTimedSetId ?? null,
  };
}

export function applySetToggle(workout, workoutExerciseId, setId, now = new Date()) {
  const current = getWorkoutExercise(workout, workoutExerciseId);
  if (!current) {
    return workout;
  }

  const target = current.sets.find((set) => set.id === setId);
  if (!target) {
    return workout;
  }

  const wasCompleted = target.completed;
  let next = mapWorkoutExercise(workout, workoutExerciseId, (exercise) =>
    toggleSetCompleted(exercise, setId, now),
  );
  next = setCurrentExercise(next, workoutExerciseId);

  if (wasCompleted) {
    return clearTimedTimer(next, setId);
  }

  next = startRest(next, workoutExerciseId, now);
  if (next.timedTimer?.setId === setId) {
    next = clearTimedTimer(next, setId);
  }
  return next;
}

export function applyTimedSetComplete(workout, workoutExerciseId, setId, now = new Date()) {
  let next = mapWorkoutExercise(workout, workoutExerciseId, (exercise) =>
    completeSet(exercise, setId, now),
  );
  next = setCurrentExercise(next, workoutExerciseId);
  next = clearTimedTimer(next, setId);
  next = startRest(next, workoutExerciseId, now);
  return next;
}

export function applySetFields(workout, workoutExerciseId, setId, fields) {
  return mapWorkoutExercise(workout, workoutExerciseId, (exercise) =>
    updateSetFields(exercise, setId, fields),
  );
}

export function applyResizeSets(workout, workoutExerciseId, nextCount) {
  return mapWorkoutExercise(workout, workoutExerciseId, (exercise) =>
    resizeSets(exercise, nextCount),
  );
}

export function applyExerciseDraft(workout, workoutExerciseId, nextSets) {
  return mapWorkoutExercise(workout, workoutExerciseId, (exercise) => {
    const minCount = getMinSetCount(exercise);
    const existing = exercise.sets || [];
    const target = Math.max(minCount, Array.isArray(nextSets) ? nextSets.length : minCount);
    const sets = [];

    for (let index = 0; index < target; index += 1) {
      const prev = existing[index];
      const draft = nextSets?.[index];
      if (prev) {
        sets.push({
          ...prev,
          reps: draft && "reps" in draft ? draft.reps : prev.reps,
          weightKg: draft && "weightKg" in draft ? draft.weightKg : prev.weightKg,
          durationSeconds:
            draft && "durationSeconds" in draft
              ? draft.durationSeconds
              : prev.durationSeconds,
          id: prev.id,
          number: index + 1,
          completed: prev.completed,
          completedAt: prev.completedAt,
        });
      } else {
        sets.push(
          createSet({
            number: index + 1,
            reps: draft?.reps ?? null,
            weightKg: draft?.weightKg ?? null,
            durationSeconds: draft?.durationSeconds ?? null,
          }),
        );
      }
    }

    return {
      ...exercise,
      sets,
    };
  });
}

export function workoutHasExercise(workout, exerciseId) {
  if (!exerciseId) {
    return false;
  }
  return (workout?.exercises || []).some((item) => item.exerciseId === exerciseId);
}

export function appendExerciseToWorkout(workout, libraryExercise) {
  if (!workout || !libraryExercise) {
    return workout;
  }
  const exerciseId = libraryExercise.id || libraryExercise.exerciseId || null;
  if (workoutHasExercise(workout, exerciseId)) {
    return workout;
  }
  const insertion = createWorkoutExercise(
    libraryExercise,
    (workout.exercises || []).length,
  );
  return {
    ...workout,
    currentExerciseId: insertion.workoutExerciseId,
    exercises: [...(workout.exercises || []), insertion],
  };
}

export function replaceWorkoutExercise(workout, workoutExerciseId, libraryExercise) {
  const current = getWorkoutExercise(workout, workoutExerciseId);
  if (!current || !libraryExercise) {
    return { workout, mode: "none" };
  }

  const nextId = libraryExercise.id || libraryExercise.exerciseId || null;
  const duplicate = (workout.exercises || []).some(
    (item) =>
      item.exerciseId === nextId && item.workoutExerciseId !== workoutExerciseId,
  );
  if (duplicate) {
    return { workout, mode: "none" };
  }

  const hasCompleted = current.sets.some((set) => set.completed);

  if (!hasCompleted) {
    const replacement = {
      ...createWorkoutExercise(libraryExercise, current.order),
      workoutExerciseId,
    };
    return {
      mode: "replace",
      workout: {
        ...clearExerciseTimedTimers(workout, workoutExerciseId),
        currentExerciseId: workoutExerciseId,
        restTimer:
          workout.restTimer?.workoutExerciseId === workoutExerciseId
            ? null
            : workout.restTimer,
        exercises: (workout.exercises || []).map((exercise) =>
          exercise.workoutExerciseId === workoutExerciseId ? replacement : exercise,
        ),
      },
    };
  }

  const insertion = createWorkoutExercise(libraryExercise, current.order + 1);
  const exercises = [];
  for (const exercise of workout.exercises || []) {
    exercises.push(exercise);
    if (exercise.workoutExerciseId === workoutExerciseId) {
      exercises.push(insertion);
    }
  }

  return {
    mode: "insert",
    workout: {
      ...workout,
      currentExerciseId: insertion.workoutExerciseId,
      exercises: exercises.map((exercise, index) => ({
        ...exercise,
        order: index,
      })),
    },
  };
}

export function getCurrentSetProgress(workout) {
  const exercise = getCurrentExercise(workout);
  if (!exercise) {
    return null;
  }
  const nextSet = getNextIncompleteSet(exercise);
  const total = exercise.sets.length;
  const currentNumber = nextSet ? nextSet.number : total;
  return {
    exercise,
    currentNumber,
    total,
    complete: !nextSet,
  };
}

export function upgradeActiveWorkout(workout) {
  if (!workout) {
    return null;
  }

  if (Array.isArray(workout.exercises) && workout.exercises.some((item) => item.workoutExerciseId)) {
    return {
      ...workout,
      currentExerciseId: workout.currentExerciseId ?? null,
      restTimer: workout.restTimer ?? null,
      timedTimer: workout.timedTimer ?? null,
      timedTimers: workout.timedTimers ?? {},
      pausedTimedSetId: workout.pausedTimedSetId ?? null,
    };
  }

  const source = workout.routineSnapshot?.exercises || [];
  const completedIds = workout.completedExerciseIds || [];
  const exercises = source.map((item, index) => {
    const parsed = parseExerciseDetails(item.details);
    const created = createWorkoutExercise(
      {
        id: item.id,
        name: item.name,
        type: parsed.parsed ? parsed.type : EXERCISE_TYPE.REPS,
        defaultSets: parsed.defaultSets || 3,
        defaultReps: parsed.defaultReps || { min: 10, max: 10 },
        defaultDurationSeconds: parsed.defaultDurationSeconds,
        durationRange: parsed.durationRange,
        restSeconds: 90,
        imagePath: item.imagePath,
        notes: parsed.notes || item.details || null,
      },
      index,
    );
    const wasDone = completedIds.includes(item.id) || completedIds.includes(item.name);
    if (wasDone) {
      created.sets = created.sets.map((set) => ({
        ...set,
        completed: true,
        completedAt: workout.startedAt || nowIso(),
      }));
    }
    return created;
  });

  return {
    ...workout,
    exercises,
    currentExerciseId: workout.currentExerciseId ?? null,
    restTimer: workout.restTimer ?? null,
    timedTimer: workout.timedTimer ?? null,
    timedTimers: workout.timedTimers ?? {},
    pausedTimedSetId: workout.pausedTimedSetId ?? null,
  };
}

export function createSession(workout, fatigue, endedAt = new Date(), waterMl = null) {
  const exercises = (workout.exercises || []).map((exercise) => ({
    ...exercise,
    sets: (exercise.sets || []).map((set) => ({ ...set })),
  }));
  const durationSeconds = Math.round(
    getElapsedMilliseconds(workout, endedAt.getTime()) / 1000,
  );
  const performed = exercises.filter((exercise) => getCompletedSets(exercise).length > 0);

  const session = {
    id: createId(),
    routineId: workout.routineId,
    routineName: workout.routineName,
    routineSnapshot: {
      name: workout.routineName,
      description: workout.routineSnapshot?.description || "",
      exercises: exercises.map((exercise, index) => toLegacySnapshotExercise(exercise, index)),
    },
    exercises,
    startedAt: workout.startedAt,
    endedAt: nowIso(endedAt),
    durationSeconds,
    exerciseCount: performed.length,
    fatigue,
  };

  if (waterMl != null && Number.isFinite(Number(waterMl))) {
    session.waterMl = Math.max(0, Math.round(Number(waterMl)));
  }

  return session;
}

export function getSessionExercises(session) {
  if (Array.isArray(session?.exercises) && session.exercises.length > 0) {
    return session.exercises;
  }
  return session?.routineSnapshot?.exercises || [];
}

function exerciseWasPerformed(exercise) {
  const sets = exercise?.sets;
  if (!Array.isArray(sets) || sets.length === 0) {
    return true;
  }
  return sets.some((set) => set.completed);
}

export function isCardioExercise(exercise) {
  if (!exercise || isStretchExercise(exercise)) {
    return false;
  }

  const id = String(exercise.exerciseId || exercise.id || "");
  if (id === "ex-cardio-final" || id.includes("cardio") || id.includes("correr")) {
    return true;
  }

  const name = normalizeName(exercise.name);
  if (name.includes("cardio") || name === "correr" || name.startsWith("correr ")) {
    return true;
  }

  const duration =
    Number(exercise.defaultDurationSeconds) ||
    Number(exercise.durationRange?.max) ||
    0;
  return (
    exercise.type === EXERCISE_TYPE.TIMED &&
    (exercise.restSeconds === 0 || exercise.restSeconds == null) &&
    duration >= 600
  );
}

export function isStrengthExercise(exercise) {
  if (!exercise || isStretchExercise(exercise) || isCardioExercise(exercise)) {
    return false;
  }
  return true;
}

export function getSessionActivityFlags(session) {
  const exercises = getSessionExercises(session).filter(exerciseWasPerformed);
  return {
    hasStrength: exercises.some(isStrengthExercise),
    hasCardio: exercises.some(isCardioExercise),
  };
}

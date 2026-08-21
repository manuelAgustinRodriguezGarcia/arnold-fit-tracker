import { createId } from "./ids";
import { nowIso } from "./dates";

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

export function snapshotRoutine(routine) {
  return {
    name: routine.name,
    description: routine.description || "",
    exercises: (routine.exercises || []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      details: exercise.details || "",
      imagePath: exercise.imagePath || null,
      order: exercise.order,
    })),
  };
}

export function createActiveWorkout(routine, startedAt = new Date()) {
  return {
    id: createId(),
    routineId: routine.id,
    routineName: routine.name,
    routineSnapshot: snapshotRoutine(routine),
    startedAt: nowIso(startedAt),
    pausedAt: null,
    accumulatedPausedMilliseconds: 0,
    completedExerciseIds: [],
    status: WORKOUT_STATUS.RUNNING,
  };
}

export function pauseWorkout(workout, pausedAt = new Date()) {
  if (!workout || workout.status === WORKOUT_STATUS.PAUSED) {
    return workout;
  }

  return {
    ...workout,
    status: WORKOUT_STATUS.PAUSED,
    pausedAt: nowIso(pausedAt),
  };
}

export function toggleCompletedExercise(workout, exerciseId) {
  if (!workout || !exerciseId) {
    return workout;
  }

  const ids = workout.completedExerciseIds || [];
  const done = ids.includes(exerciseId);

  return {
    ...workout,
    completedExerciseIds: done
      ? ids.filter((id) => id !== exerciseId)
      : [...ids, exerciseId],
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

  return {
    ...workout,
    status: WORKOUT_STATUS.RUNNING,
    pausedAt: null,
    accumulatedPausedMilliseconds:
      (workout.accumulatedPausedMilliseconds || 0) + pauseDuration,
  };
}

export function getElapsedMilliseconds(workout, now = Date.now()) {
  if (!workout) {
    return 0;
  }

  const startedAt = new Date(workout.startedAt).getTime();
  let paused = workout.accumulatedPausedMilliseconds || 0;

  if (workout.status === WORKOUT_STATUS.PAUSED && workout.pausedAt) {
    paused += Math.max(0, now - new Date(workout.pausedAt).getTime());
  }

  return Math.max(0, now - startedAt - paused);
}

export function createSession(workout, fatigue, endedAt = new Date()) {
  const snapshot = workout.routineSnapshot || { exercises: [] };
  const durationSeconds = Math.round(
    getElapsedMilliseconds(workout, endedAt.getTime()) / 1000,
  );

  return {
    id: createId(),
    routineId: workout.routineId,
    routineName: workout.routineName,
    routineSnapshot: snapshot,
    startedAt: workout.startedAt,
    endedAt: nowIso(endedAt),
    durationSeconds,
    exerciseCount: Array.isArray(snapshot.exercises)
      ? snapshot.exercises.length
      : 0,
    fatigue,
  };
}

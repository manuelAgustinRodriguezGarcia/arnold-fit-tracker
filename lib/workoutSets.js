import { createId } from "./ids";
import { nowIso } from "./dates";
import {
  EXERCISE_TYPE,
  getDefaultDurationValue,
  getDefaultRepsValue,
} from "./exercises";

export function createSet(input = {}) {
  return {
    id: input.id || createId(),
    number: input.number || 1,
    reps: input.reps ?? null,
    weightKg: input.weightKg ?? null,
    durationSeconds: input.durationSeconds ?? null,
    completed: Boolean(input.completed),
    completedAt: input.completedAt || null,
  };
}

export function createSetsFromExercise(exercise, count) {
  const type = exercise?.type === EXERCISE_TYPE.TIMED ? EXERCISE_TYPE.TIMED : EXERCISE_TYPE.REPS;
  const total = Math.max(1, Number(count) || exercise?.defaultSets || 3);
  const reps = type === EXERCISE_TYPE.REPS ? getDefaultRepsValue(exercise) : null;
  const weightKg = type === EXERCISE_TYPE.REPS ? exercise?.defaultWeightKg ?? null : null;
  const durationSeconds = type === EXERCISE_TYPE.TIMED ? getDefaultDurationValue(exercise) : null;

  return Array.from({ length: total }, (_, index) =>
    createSet({
      number: index + 1,
      reps,
      weightKg,
      durationSeconds,
    }),
  );
}

export function getCompletedSets(exercise) {
  return (exercise?.sets || []).filter((set) => set.completed);
}

export function getNextIncompleteSet(exercise) {
  return (exercise?.sets || []).find((set) => !set.completed) || null;
}

export function isExerciseComplete(exercise) {
  const sets = exercise?.sets || [];
  return sets.length > 0 && sets.every((set) => set.completed);
}

export function getLastCompletedSetIndex(exercise) {
  return (exercise?.sets || []).reduce((last, set, index) => (set.completed ? index : last), -1);
}

export function getMinSetCount(exercise) {
  return Math.max(1, getLastCompletedSetIndex(exercise) + 1);
}

export function toggleSetCompleted(exercise, setId, now = new Date()) {
  return {
    ...exercise,
    sets: (exercise.sets || []).map((set) => {
      if (set.id !== setId) {
        return set;
      }
      if (set.completed) {
        return {
          ...set,
          completed: false,
          completedAt: null,
        };
      }
      return {
        ...set,
        completed: true,
        completedAt: nowIso(now),
      };
    }),
  };
}

export function completeSet(exercise, setId, now = new Date()) {
  return {
    ...exercise,
    sets: (exercise.sets || []).map((set) =>
      set.id === setId
        ? {
            ...set,
            completed: true,
            completedAt: set.completedAt || nowIso(now),
          }
        : set,
    ),
  };
}

export function updateSetFields(exercise, setId, fields) {
  return {
    ...exercise,
    sets: (exercise.sets || []).map((set) =>
      set.id === setId
        ? {
            ...set,
            ...fields,
            completed: set.completed,
            completedAt: set.completedAt,
          }
        : set,
    ),
  };
}

export function resizeSets(exercise, nextCount) {
  const current = exercise.sets || [];
  const minCount = getMinSetCount(exercise);
  const target = Math.max(minCount, Math.round(Number(nextCount) || minCount));

  if (target === current.length) {
    return exercise;
  }

  if (target < current.length) {
    return {
      ...exercise,
      sets: current.slice(0, target),
    };
  }

  const last = current[current.length - 1];
  const extras = [];
  for (let index = current.length; index < target; index += 1) {
    extras.push(
      createSet({
        number: index + 1,
        reps:
          last?.reps ??
          (exercise.type === EXERCISE_TYPE.TIMED ? null : getDefaultRepsValue(exercise)),
        weightKg:
          last?.weightKg ??
          (exercise.type === EXERCISE_TYPE.TIMED ? null : exercise.defaultWeightKg ?? null),
        durationSeconds:
          last?.durationSeconds ??
          (exercise.type === EXERCISE_TYPE.TIMED ? getDefaultDurationValue(exercise) : null),
      }),
    );
  }

  return {
    ...exercise,
    sets: [...current, ...extras],
  };
}

export function getSetVolume(set) {
  if (!set?.completed || set.weightKg == null || set.reps == null) {
    return 0;
  }
  return Number(set.weightKg) * Number(set.reps);
}

export function getExerciseVolume(exercise) {
  return getCompletedSets(exercise).reduce((total, set) => total + getSetVolume(set), 0);
}

export function getMaxWeight(exercise) {
  const weights = getCompletedSets(exercise)
    .map((set) => set.weightKg)
    .filter((value) => value != null);
  if (weights.length === 0) {
    return null;
  }
  return Math.max(...weights);
}

export function getLastWeight(exercise) {
  const completed = getCompletedSets(exercise);
  for (let index = completed.length - 1; index >= 0; index -= 1) {
    if (completed[index].weightKg != null) {
      return completed[index].weightKg;
    }
  }
  return null;
}

export function getExerciseDuration(exercise) {
  return getCompletedSets(exercise).reduce(
    (total, set) => total + (Number(set.durationSeconds) || 0),
    0,
  );
}

export function getBestDuration(exercise) {
  const durations = getCompletedSets(exercise)
    .map((set) => Number(set.durationSeconds) || 0)
    .filter((value) => value > 0);
  if (durations.length === 0) {
    return null;
  }
  return Math.max(...durations);
}

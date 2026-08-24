import { createId } from "./ids";
import { nowIso } from "./dates";
import {
  EXERCISE_TYPE,
  formatReps,
  formatSeconds,
  parseExerciseDetails,
  resolveRoutineExercises,
} from "./exercises";
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

  const ts = pausedAt.getTime();
  return {
    ...workout,
    status: WORKOUT_STATUS.PAUSED,
    pausedAt: nowIso(pausedAt),
    elapsedMilliseconds: getElapsedMilliseconds(
      { ...workout, status: WORKOUT_STATUS.RUNNING, pausedAt: null },
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

  return {
    ...workout,
    status: WORKOUT_STATUS.RUNNING,
    pausedAt: null,
    elapsedMilliseconds: null,
    accumulatedPausedMilliseconds:
      (workout.accumulatedPausedMilliseconds || 0) + pauseDuration,
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

export function startTimedSet(workout, workoutExerciseId, setId, now = new Date()) {
  const exercise = getWorkoutExercise(workout, workoutExerciseId);
  const set = exercise?.sets?.find((item) => item.id === setId);
  const duration = Math.max(1, Number(set?.durationSeconds) || 60);

  return {
    ...workout,
    currentExerciseId: workoutExerciseId,
    timedTimer: {
      workoutExerciseId,
      setId,
      startedAt: nowIso(now),
      endsAt: new Date(now.getTime() + duration * 1000).toISOString(),
    },
  };
}

export function clearTimedTimer(workout) {
  if (!workout) {
    return workout;
  }
  return {
    ...workout,
    timedTimer: null,
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
    if (next.timedTimer?.setId === setId) {
      next = clearTimedTimer(next);
    }
    return next;
  }

  next = startRest(next, workoutExerciseId, now);
  if (next.timedTimer?.setId === setId) {
    next = clearTimedTimer(next);
  }
  return next;
}

export function applyTimedSetComplete(workout, workoutExerciseId, setId, now = new Date()) {
  let next = mapWorkoutExercise(workout, workoutExerciseId, (exercise) =>
    completeSet(exercise, setId, now),
  );
  next = setCurrentExercise(next, workoutExerciseId);
  next = clearTimedTimer(next);
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

export function appendExerciseToWorkout(workout, libraryExercise) {
  if (!workout || !libraryExercise) {
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

  const hasCompleted = current.sets.some((set) => set.completed);

  if (!hasCompleted) {
    const replacement = {
      ...createWorkoutExercise(libraryExercise, current.order),
      workoutExerciseId,
    };
    return {
      mode: "replace",
      workout: {
        ...workout,
        currentExerciseId: workoutExerciseId,
        timedTimer:
          workout.timedTimer?.workoutExerciseId === workoutExerciseId
            ? null
            : workout.timedTimer,
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
  };
}

export function createSession(workout, fatigue, endedAt = new Date()) {
  const exercises = (workout.exercises || []).map((exercise) => ({
    ...exercise,
    sets: (exercise.sets || []).map((set) => ({ ...set })),
  }));
  const durationSeconds = Math.round(
    getElapsedMilliseconds(workout, endedAt.getTime()) / 1000,
  );
  const performed = exercises.filter((exercise) => getCompletedSets(exercise).length > 0);

  return {
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
}

export function getSessionExercises(session) {
  if (Array.isArray(session?.exercises) && session.exercises.length > 0) {
    return session.exercises;
  }
  return session?.routineSnapshot?.exercises || [];
}

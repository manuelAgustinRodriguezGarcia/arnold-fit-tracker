"use client";

import { createContext, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getArnoldServerSnapshot,
  getArnoldStoreSnapshot,
  subscribeArnoldStore,
  updateArnoldStore,
} from "@/lib/arnoldStore";
import { createId } from "@/lib/ids";
import { createExerciseRecord, findExerciseById } from "@/lib/exercises";
import { applyThemeAttributes, normalizeAppearance, normalizeThemePalette } from "@/lib/themes";
import {
  adjustRestTimer,
  applyResizeSets,
  applySetFields,
  applySetToggle,
  applyTimedSetComplete,
  applyExerciseDraft,
  appendExerciseToWorkout,
  clearExpiredRest,
  createActiveWorkout,
  createSession,
  pauseWorkout as pauseWorkoutState,
  replaceWorkoutExercise,
  resumeWorkout as resumeWorkoutState,
  setCurrentExercise,
  skipRest,
  startTimedSet,
} from "@/lib/workout";

export const ArnoldContext = createContext(null);

function subscribeNoop() {
  return () => {};
}

function getClientReady() {
  return true;
}

function getServerReady() {
  return false;
}

function normalizeRoutineEntries(exercises) {
  return (exercises || [])
    .map((item, index) => ({
      exerciseId: item.exerciseId || item.id,
      order: index,
    }))
    .filter((item) => Boolean(item.exerciseId));
}

export function ArnoldProvider({ children }) {
  const state = useSyncExternalStore(
    subscribeArnoldStore,
    getArnoldStoreSnapshot,
    getArnoldServerSnapshot,
  );
  const isReady = useSyncExternalStore(
    subscribeNoop,
    getClientReady,
    getServerReady,
  );
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    applyThemeAttributes(state.settings?.themePalette, state.settings?.appearance);
  }, [state.settings?.themePalette, state.settings?.appearance]);

  const showNotice = useCallback((message) => {
    setNotice({ id: createId(), message });
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const createExercise = useCallback(
    (payload) => {
      const name = (payload?.name || "").trim();
      if (!name) {
        return { ok: false, error: "El nombre es obligatorio." };
      }

      const exercise = createExerciseRecord({
        ...payload,
        name,
      });

      updateArnoldStore((current) => ({
        ...current,
        exercises: [...current.exercises, exercise],
      }));

      showNotice("Ejercicio creado");
      return { ok: true, exercise };
    },
    [showNotice],
  );

  const updateExercise = useCallback(
    (exerciseId, payload) => {
      const name = (payload?.name || "").trim();
      if (!name) {
        return { ok: false, error: "El nombre es obligatorio." };
      }

      updateArnoldStore((current) => ({
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? createExerciseRecord({
                ...exercise,
                ...payload,
                id: exercise.id,
                name,
                createdAt: exercise.createdAt,
              })
            : exercise,
        ),
      }));

      showNotice("Ejercicio actualizado");
      return { ok: true };
    },
    [showNotice],
  );

  const deleteExercise = useCallback(
    (exerciseId) => {
      updateArnoldStore((current) => ({
        ...current,
        exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId),
        routines: current.routines.map((routine) => ({
          ...routine,
          exercises: (routine.exercises || []).filter(
            (item) => item.exerciseId !== exerciseId,
          ).map((item, index) => ({ ...item, order: index })),
        })),
      }));
      showNotice("Ejercicio eliminado");
    },
    [showNotice],
  );

  const createRoutine = useCallback(
    ({ name, description, exercises }) => {
      const trimmedName = (name || "").trim();
      if (!trimmedName) {
        return { ok: false, error: "El nombre es obligatorio." };
      }

      updateArnoldStore((current) => ({
        ...current,
        routines: [
          ...current.routines,
          {
            id: createId(),
            name: trimmedName,
            description: (description || "").trim(),
            exercises: normalizeRoutineEntries(exercises),
          },
        ],
      }));

      showNotice("Rutina creada");
      return { ok: true };
    },
    [showNotice],
  );

  const updateRoutine = useCallback(
    (routineId, { name, description, exercises }) => {
      const trimmedName = (name || "").trim();
      if (!trimmedName) {
        return { ok: false, error: "El nombre es obligatorio." };
      }

      updateArnoldStore((current) => ({
        ...current,
        routines: current.routines.map((routine) =>
          routine.id === routineId
            ? {
                ...routine,
                name: trimmedName,
                description: (description || "").trim(),
                exercises: normalizeRoutineEntries(exercises),
              }
            : routine,
        ),
      }));

      showNotice("Rutina actualizada");
      return { ok: true };
    },
    [showNotice],
  );

  const deleteRoutine = useCallback(
    (routineId) => {
      updateArnoldStore((current) => ({
        ...current,
        routines: current.routines.filter((routine) => routine.id !== routineId),
      }));
      showNotice("Rutina eliminada");
    },
    [showNotice],
  );

  const deleteSession = useCallback(
    (sessionId) => {
      updateArnoldStore((current) => ({
        ...current,
        sessions: current.sessions.filter((session) => session.id !== sessionId),
      }));
      showNotice("Entrenamiento eliminado");
    },
    [showNotice],
  );

  const startWorkout = useCallback((routineId) => {
    let result = { ok: false, code: "unknown" };

    updateArnoldStore((current) => {
      if (current.activeWorkout) {
        result = { ok: false, code: "already-active" };
        return current;
      }

      const routine = current.routines.find((item) => item.id === routineId);
      if (!routine) {
        result = { ok: false, code: "missing-routine" };
        return current;
      }

      const workout = createActiveWorkout(routine, current.exercises);
      result = { ok: true, workout };
      return { ...current, activeWorkout: workout };
    });

    return result;
  }, []);

  const pauseActiveWorkout = useCallback(() => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: pauseWorkoutState(current.activeWorkout, new Date()),
      };
    });
  }, []);

  const resumeActiveWorkout = useCallback(() => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: resumeWorkoutState(current.activeWorkout, new Date()),
      };
    });
  }, []);

  const markCurrentExercise = useCallback((workoutExerciseId) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: setCurrentExercise(current.activeWorkout, workoutExerciseId),
      };
    });
  }, []);

  const toggleSetDone = useCallback((workoutExerciseId, setId) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: applySetToggle(
          current.activeWorkout,
          workoutExerciseId,
          setId,
          new Date(),
        ),
      };
    });
  }, []);

  const updateWorkoutSet = useCallback((workoutExerciseId, setId, fields) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: applySetFields(
          current.activeWorkout,
          workoutExerciseId,
          setId,
          fields,
        ),
      };
    });
  }, []);

  const updateSettings = useCallback((patch) => {
    updateArnoldStore((current) => {
      const nextSettings = {
        ...(current.settings || {}),
        ...patch,
        ...(patch.themePalette
          ? { themePalette: normalizeThemePalette(patch.themePalette) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(patch || {}, "appearance")
          ? { appearance: normalizeAppearance(patch.appearance) }
          : {}),
      };
      applyThemeAttributes(nextSettings.themePalette, nextSettings.appearance);
      return {
        ...current,
        settings: nextSettings,
      };
    });
  }, []);

  const saveWorkoutExercise = useCallback((workoutExerciseId, nextSets) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: applyExerciseDraft(
          current.activeWorkout,
          workoutExerciseId,
          nextSets,
        ),
      };
    });
  }, []);

  const addExerciseToActiveWorkout = useCallback((exerciseId) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const libraryExercise = findExerciseById(current.exercises, exerciseId);
      if (!libraryExercise) {
        return current;
      }
      return {
        ...current,
        activeWorkout: appendExerciseToWorkout(
          current.activeWorkout,
          libraryExercise,
        ),
      };
    });
  }, []);

  const changeWorkoutSetCount = useCallback((workoutExerciseId, nextCount) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: applyResizeSets(
          current.activeWorkout,
          workoutExerciseId,
          nextCount,
        ),
      };
    });
  }, []);

  const adjustActiveRest = useCallback((deltaSeconds) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: adjustRestTimer(current.activeWorkout, deltaSeconds, new Date()),
      };
    });
  }, []);

  const skipActiveRest = useCallback(() => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: skipRest(current.activeWorkout),
      };
    });
  }, []);

  const expireActiveRest = useCallback(() => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      const next = clearExpiredRest(current.activeWorkout);
      return next === current.activeWorkout ? current : { ...current, activeWorkout: next };
    });
  }, []);

  const beginTimedSet = useCallback((workoutExerciseId, setId) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: startTimedSet(
          current.activeWorkout,
          workoutExerciseId,
          setId,
          new Date(),
        ),
      };
    });
  }, []);

  const finishTimedSet = useCallback((workoutExerciseId, setId) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }
      return {
        ...current,
        activeWorkout: applyTimedSetComplete(
          current.activeWorkout,
          workoutExerciseId,
          setId,
          new Date(),
        ),
      };
    });
  }, []);

  const swapWorkoutExercise = useCallback(
    (workoutExerciseId, exerciseId) => {
      let mode = "none";
      updateArnoldStore((current) => {
        if (!current.activeWorkout) {
          return current;
        }
        const libraryExercise = findExerciseById(current.exercises, exerciseId);
        if (!libraryExercise) {
          return current;
        }
        const result = replaceWorkoutExercise(
          current.activeWorkout,
          workoutExerciseId,
          libraryExercise,
        );
        mode = result.mode;
        return {
          ...current,
          activeWorkout: result.workout,
        };
      });
      if (mode === "insert") {
        showNotice("Ejercicio agregado como reemplazo");
      }
      return mode;
    },
    [showNotice],
  );

  const finishWorkout = useCallback(
    (fatigue) => {
      let saved = false;

      updateArnoldStore((current) => {
        if (!current.activeWorkout) {
          return current;
        }

        const session = createSession(current.activeWorkout, fatigue, new Date());
        saved = true;
        return {
          ...current,
          sessions: [session, ...current.sessions],
          activeWorkout: null,
        };
      });

      if (saved) {
        showNotice("Entrenamiento guardado");
      }

      return saved;
    },
    [showNotice],
  );

  const value = useMemo(
    () => ({
      isReady,
      exercises: state.exercises || [],
      routines: state.routines || [],
      sessions: state.sessions || [],
      activeWorkout: state.activeWorkout,
      settings: state.settings,
      notice,
      showNotice,
      clearNotice,
      updateSettings,
      createExercise,
      updateExercise,
      deleteExercise,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      deleteSession,
      startWorkout,
      pauseActiveWorkout,
      resumeActiveWorkout,
      markCurrentExercise,
      toggleSetDone,
      updateWorkoutSet,
      changeWorkoutSetCount,
      saveWorkoutExercise,
      addExerciseToActiveWorkout,
      adjustActiveRest,
      skipActiveRest,
      expireActiveRest,
      beginTimedSet,
      finishTimedSet,
      swapWorkoutExercise,
      finishWorkout,
    }),
    [
      isReady,
      state.exercises,
      state.routines,
      state.sessions,
      state.activeWorkout,
      state.settings,
      notice,
      showNotice,
      clearNotice,
      updateSettings,
      createExercise,
      updateExercise,
      deleteExercise,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      deleteSession,
      startWorkout,
      pauseActiveWorkout,
      resumeActiveWorkout,
      markCurrentExercise,
      toggleSetDone,
      updateWorkoutSet,
      changeWorkoutSetCount,
      saveWorkoutExercise,
      addExerciseToActiveWorkout,
      adjustActiveRest,
      skipActiveRest,
      expireActiveRest,
      beginTimedSet,
      finishTimedSet,
      swapWorkoutExercise,
      finishWorkout,
    ],
  );

  return (
    <ArnoldContext.Provider value={value}>{children}</ArnoldContext.Provider>
  );
}

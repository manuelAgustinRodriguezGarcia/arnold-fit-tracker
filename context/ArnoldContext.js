"use client";

import { createContext, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  getArnoldServerSnapshot,
  getArnoldStoreSnapshot,
  subscribeArnoldStore,
  updateArnoldStore,
} from "@/lib/arnoldStore";
import { createId } from "@/lib/ids";
import {
  createActiveWorkout,
  createSession,
  pauseWorkout as pauseWorkoutState,
  resumeWorkout as resumeWorkoutState,
  toggleCompletedExercise,
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

function normalizeExercises(exercises) {
  return exercises
    .map((exercise, index) => ({
      id: exercise.id || createId(),
      name: (exercise.name || "").trim(),
      details: (exercise.details || "").trim(),
      imagePath: (exercise.imagePath || "").trim() || null,
      order: index,
    }))
    .filter((exercise) => exercise.name.length > 0);
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

  const showNotice = useCallback((message) => {
    setNotice({ id: createId(), message });
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const createRoutine = useCallback(
    ({ name, description, exercises }) => {
      const trimmedName = (name || "").trim();
      if (!trimmedName) {
        return { ok: false, error: "El nombre es obligatorio." };
      }

      const normalized = normalizeExercises(exercises || []);
      updateArnoldStore((current) => ({
        ...current,
        routines: [
          ...current.routines,
          {
            id: createId(),
            name: trimmedName,
            description: (description || "").trim(),
            exercises: normalized,
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

      const normalized = normalizeExercises(exercises || []);
      updateArnoldStore((current) => ({
        ...current,
        routines: current.routines.map((routine) =>
          routine.id === routineId
            ? {
                ...routine,
                name: trimmedName,
                description: (description || "").trim(),
                exercises: normalized,
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

      const workout = createActiveWorkout(routine);
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

  const toggleExerciseDone = useCallback((exerciseId) => {
    updateArnoldStore((current) => {
      if (!current.activeWorkout) {
        return current;
      }

      return {
        ...current,
        activeWorkout: toggleCompletedExercise(
          current.activeWorkout,
          exerciseId,
        ),
      };
    });
  }, []);

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
      routines: state.routines,
      sessions: state.sessions,
      activeWorkout: state.activeWorkout,
      settings: state.settings,
      notice,
      showNotice,
      clearNotice,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      deleteSession,
      startWorkout,
      pauseActiveWorkout,
      resumeActiveWorkout,
      toggleExerciseDone,
      finishWorkout,
    }),
    [
      isReady,
      state.routines,
      state.sessions,
      state.activeWorkout,
      state.settings,
      notice,
      showNotice,
      clearNotice,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      deleteSession,
      startWorkout,
      pauseActiveWorkout,
      resumeActiveWorkout,
      toggleExerciseDone,
      finishWorkout,
    ],
  );

  return (
    <ArnoldContext.Provider value={value}>{children}</ArnoldContext.Provider>
  );
}

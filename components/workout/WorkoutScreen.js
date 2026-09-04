"use client";

import { useMemo, useState } from "react";
import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Bone,
  BoneFracture,
  Check,
  ChevronLeft,
  Pause,
  Play,
  Plus,
  Square,
} from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";
import { Modal } from "@/components/ui/Modal";
import { ExerciseEditor } from "@/components/routines/ExerciseEditor";
import { ExerciseSelector } from "@/components/routines/ExerciseSelector";
import { ExerciseWorkoutEditor } from "@/components/workout/ExerciseWorkoutEditor";
import { HydrationStep } from "@/components/workout/HydrationStep";
import { RestTimerSlot } from "@/components/workout/RestTimerPill";
import { WorkoutExercise } from "@/components/workout/WorkoutExercise";
import { useArnold } from "@/hooks/useArnold";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { EXERCISE_TYPE } from "@/lib/exercises";
import { isStretchExercise, STRETCH_PRESETS } from "@/lib/stretchPresets";
import { FATIGUE, WORKOUT_STATUS } from "@/lib/workout";
import { isExerciseComplete } from "@/lib/workoutSets";
import styles from "./WorkoutScreen.module.css";

const FATIGUE_OPTIONS = [
  {
    value: FATIGUE.VERY_TIRED,
    label: "Muy cansado",
    Icon: BatteryLow,
    className: "fatigueVeryTired",
  },
  {
    value: FATIGUE.TIRED,
    label: "Cansado",
    Icon: BatteryMedium,
    className: "fatigueTired",
  },
  {
    value: FATIGUE.REGULAR,
    label: "Regular",
    Icon: BatteryFull,
    className: "fatigueRegular",
  },
];

function formatStretchMeta(exercise) {
  const sets = Math.max(1, Number(exercise?.defaultSets) || 1);
  const total = Math.max(1, Math.round(Number(exercise?.defaultDurationSeconds) || 90));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${sets} × ${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function WorkoutScreen({ onMinimize, onFinished }) {
  const {
    exercises: libraryExercises,
    activeWorkout,
    pauseActiveWorkout,
    resumeActiveWorkout,
    toggleSetDone,
    beginTimedSet,
    markCurrentExercise,
    swapWorkoutExercise,
    finishWorkout,
    addExerciseToActiveWorkout,
    removeExerciseFromActiveWorkout,
  } = useArnold();
  const { display } = useWorkoutTimer(activeWorkout);
  const [fatigueOpen, setFatigueOpen] = useState(false);
  const [hydrationOpen, setHydrationOpen] = useState(false);
  const [pendingFatigue, setPendingFatigue] = useState(null);
  const [waterMl, setWaterMl] = useState(null);
  const [editing, setEditing] = useState(null);
  const [replacing, setReplacing] = useState(null);
  const [stretchOpen, setStretchOpen] = useState(false);
  const [stretchCreatorOpen, setStretchCreatorOpen] = useState(false);
  const [selectedStretchIds, setSelectedStretchIds] = useState([]);
  const [finishStretchIds, setFinishStretchIds] = useState([]);
  const [finishPhase, setFinishPhase] = useState(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const [exerciseCreatorOpen, setExerciseCreatorOpen] = useState(false);
  useBodyScrollLock(Boolean(activeWorkout));

  const stretchItems = useMemo(() => {
    const presetIds = STRETCH_PRESETS.map((preset) => preset.id);
    const fromPresets = presetIds
      .map((id) => libraryExercises.find((exercise) => exercise.id === id))
      .filter(Boolean);
    const custom = libraryExercises
      .filter((exercise) => isStretchExercise(exercise) && !presetIds.includes(exercise.id))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return [...fromPresets, ...custom];
  }, [libraryExercises]);

  const exercises = activeWorkout?.exercises || [];
  const isStretching = finishPhase === "stretching";

  const finishStretchesDone = useMemo(() => {
    if (!finishStretchIds.length) {
      return false;
    }
    const tracked = exercises.filter((exercise) =>
      finishStretchIds.includes(exercise.exerciseId),
    );
    return (
      tracked.length === finishStretchIds.length &&
      tracked.every((exercise) => isExerciseComplete(exercise))
    );
  }, [exercises, finishStretchIds]);

  const visibleExercises = useMemo(() => {
    if (isStretching) {
      const order = new Map(finishStretchIds.map((id, index) => [id, index]));
      return exercises
        .filter((exercise) => finishStretchIds.includes(exercise.exerciseId))
        .sort(
          (a, b) =>
            (order.get(a.exerciseId) ?? 0) - (order.get(b.exerciseId) ?? 0),
        );
    }
    return exercises.filter(
      (exercise) => !finishStretchIds.includes(exercise.exerciseId),
    );
  }, [exercises, finishStretchIds, isStretching]);

  const showFinalFinish =
    finishPhase === "ready" || (isStretching && finishStretchesDone);

  if (!activeWorkout) {
    return null;
  }

  const paused = activeWorkout.status === WORKOUT_STATUS.PAUSED;

  function onToggleSet(exercise, set) {
    if (exercise.type === EXERCISE_TYPE.TIMED && !set.completed) {
      beginTimedSet(exercise.workoutExerciseId, set.id);
      return;
    }
    toggleSetDone(exercise.workoutExerciseId, set.id);
  }

  function startFinishFlow() {
    setSelectedStretchIds([]);
    setFinishStretchIds([]);
    setFinishPhase("pick");
    setStretchOpen(true);
  }

  function cancelStretchPick() {
    setStretchOpen(false);
    setStretchCreatorOpen(false);
    setSelectedStretchIds([]);
    if (!isStretching) {
      setFinishStretchIds([]);
      setFinishPhase(null);
    }
  }

  function skipStretch() {
    setStretchOpen(false);
    setStretchCreatorOpen(false);
    setSelectedStretchIds([]);
    setFinishStretchIds([]);
    setFinishPhase(null);
    setFatigueOpen(true);
  }

  function beginStretching() {
    const selected = [...selectedStretchIds];
    setStretchOpen(false);
    setStretchCreatorOpen(false);
    setSelectedStretchIds([]);

    if (isStretching) {
      if (selected.length === 0) {
        return;
      }
      const nextIds = [...finishStretchIds];
      for (const exerciseId of selected) {
        if (!nextIds.includes(exerciseId)) {
          nextIds.push(exerciseId);
        }
        const already = exercises.some((item) => item.exerciseId === exerciseId);
        if (!already) {
          addExerciseToActiveWorkout(exerciseId);
        }
      }
      setFinishStretchIds(nextIds);
      return;
    }

    if (selected.length === 0) {
      setFinishStretchIds([]);
      setFinishPhase("ready");
      return;
    }
    for (const exerciseId of selected) {
      const already = exercises.some((item) => item.exerciseId === exerciseId);
      if (!already) {
        addExerciseToActiveWorkout(exerciseId);
      }
    }
    setFinishStretchIds(selected);
    setFinishPhase("stretching");
  }

  function openAddStretch() {
    setSelectedStretchIds([]);
    setStretchOpen(true);
  }

  function onSelectFatigue(value) {
    setPendingFatigue(value);
    setWaterMl(null);
    setFatigueOpen(false);
    setHydrationOpen(true);
  }

  function completeFinish(nextWaterMl) {
    const saved = finishWorkout(pendingFatigue, nextWaterMl);
    setHydrationOpen(false);
    setPendingFatigue(null);
    setWaterMl(null);
    setFinishPhase(null);
    setSelectedStretchIds([]);
    setFinishStretchIds([]);
    if (saved) {
      onFinished();
    }
  }

  function toggleStretch(exerciseId) {
    if (!exerciseId) {
      return;
    }
    setSelectedStretchIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId],
    );
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Volver" onClick={onMinimize}>
          <ChevronLeft size={22} />
        </IconButton>
        <BrandMark />
      </header>

      <div className={styles.body}>
        <ul className={styles.exercises}>
        {visibleExercises.map((exercise) => (
          <li key={`${exercise.workoutExerciseId}:${exercise.exerciseId || exercise.name}`}>
            <WorkoutExercise
              exercise={exercise}
              current={activeWorkout.currentExerciseId === exercise.workoutExerciseId}
              timedTimer={activeWorkout.timedTimer}
              onToggleSet={onToggleSet}
              onEdit={() => {
                markCurrentExercise(exercise.workoutExerciseId);
                setEditing(exercise.workoutExerciseId);
              }}
            />
          </li>
        ))}
        <li className={styles.endActions}>
          {isStretching ? (
            <Button
              variant="secondary"
              size="lg"
              icon={<Plus size={18} />}
              onClick={openAddStretch}
            >
              Agregar elongación
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="lg"
              icon={<Plus size={18} />}
              onClick={() => setAddingOpen(true)}
            >
              Agregar ejercicio
            </Button>
          )}
        </li>
      </ul>
      </div>

      <RestTimerSlot restTimer={activeWorkout.restTimer} className={styles.restSlot} />

      <div className={styles.controls}>
        {showFinalFinish ? (
          <>
            <span className={styles.controlsSpacer} aria-hidden="true" />
            <p className={styles.timer} aria-live="polite">{display}</p>
            <Button size="lg" variant="danger" icon={<Square size={16} />} onClick={() => setFatigueOpen(true)}>
              FINALIZAR
            </Button>
          </>
        ) : isStretching ? (
          <>
            {paused ? (
              <Button size="lg" icon={<Play size={18} />} onClick={resumeActiveWorkout}>
                Reanudar
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                icon={<Pause size={18} />}
                onClick={pauseActiveWorkout}
              >
                Pausar
              </Button>
            )}
            <p className={styles.timer} aria-live="polite">{display}</p>
            <span className={styles.controlsSpacer} aria-hidden="true" />
          </>
        ) : (
          <>
            {paused ? (
              <Button size="lg" icon={<Play size={18} />} onClick={resumeActiveWorkout}>
                Reanudar
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                icon={<Pause size={18} />}
                onClick={pauseActiveWorkout}
              >
                Pausar
              </Button>
            )}
            <p className={styles.timer} aria-live="polite">{display}</p>
            <Button
              variant="danger"
              size="lg"
              icon={<Square size={16} />}
              onClick={startFinishFlow}
            >
              Finalizar
            </Button>
          </>
        )}
      </div>

      <Modal
        open={fatigueOpen}
        title="¿Cómo terminaste?"
        onClose={() => setFatigueOpen(false)}
      >
        <div className={styles.fatigue}>
          {FATIGUE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.fatigueCard} ${styles[option.className]}`}
              onClick={() => onSelectFatigue(option.value)}
            >
              <option.Icon size={26} />
              {option.label}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={hydrationOpen}
        title="Cantidad de agua tomada"
        onClose={() => completeFinish(null)}
        footer={
          <>
            <Button size="lg" onClick={() => completeFinish(waterMl)}>
              Continuar
            </Button>
            <Button variant="secondary" size="lg" onClick={() => completeFinish(null)}>
              Omitir
            </Button>
          </>
        }
      >
        <HydrationStep key={pendingFatigue || "water"} onChange={setWaterMl} />
      </Modal>

      {editing ? (
        <ExerciseWorkoutEditor
          key={`${editing}:${
            exercises.find((item) => item.workoutExerciseId === editing)?.exerciseId || ""
          }`}
          exercise={exercises.find((item) => item.workoutExerciseId === editing)}
          onClose={() => setEditing(null)}
          onReplace={() => {
            setReplacing(editing);
            setEditing(null);
          }}
          onRemove={() => {
            if (removeExerciseFromActiveWorkout(editing)) {
              setEditing(null);
            }
          }}
        />
      ) : null}

      <Modal
        open={stretchOpen}
        title="Elongar"
        onClose={cancelStretchPick}
        footer={
          <div className={styles.stretchFooter}>
            {isStretching ? (
              <Button variant="secondary" size="lg" onClick={cancelStretchPick}>
                Cancelar
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                icon={<BoneFracture size={18} />}
                onClick={skipStretch}
              >
                Omitir
              </Button>
            )}
            <Button
              size="lg"
              icon={<Bone size={18} />}
              disabled={selectedStretchIds.length === 0}
              onClick={beginStretching}
            >
              {isStretching ? "Agregar" : "Elongar"}
            </Button>
          </div>
        }
      >
        <div className={styles.stretchList}>
          {stretchItems
            .filter((stretch) => !isStretching || !finishStretchIds.includes(stretch.id))
            .map((stretch) => {
            const selected = selectedStretchIds.includes(stretch.id);
            return (
              <button
                key={stretch.id}
                type="button"
                className={`${styles.stretchItem} ${selected ? styles.stretchItemSelected : ""}`}
                aria-pressed={selected}
                onClick={() => toggleStretch(stretch.id)}
              >
                <span className={styles.stretchCopy}>
                  <strong>{stretch.name}</strong>
                  <span>{formatStretchMeta(stretch)}</span>
                </span>
                {selected ? (
                  <span className={styles.stretchCheck} aria-hidden="true">
                    <Check size={18} strokeWidth={2.6} />
                  </span>
                ) : null}
              </button>
            );
          })}
          <Button
            variant="secondary"
            size="lg"
            icon={<Plus size={18} />}
            onClick={() => setStretchCreatorOpen(true)}
          >
            Agregar nueva elongación
          </Button>
        </div>
      </Modal>

      {stretchCreatorOpen ? (
        <ExerciseEditor
          asStretch
          onClose={() => setStretchCreatorOpen(false)}
          onCreated={(exercise) => {
            if (exercise?.id) {
              toggleStretch(exercise.id);
              setStretchCreatorOpen(false);
            }
          }}
        />
      ) : null}

      {exerciseCreatorOpen ? (
        <ExerciseEditor
          onClose={() => setExerciseCreatorOpen(false)}
          onCreated={(exercise) => {
            if (exercise?.id) {
              addExerciseToActiveWorkout(exercise.id);
            }
            setExerciseCreatorOpen(false);
            setAddingOpen(false);
          }}
        />
      ) : null}

      <ExerciseSelector
        open={addingOpen}
        title="Agregar ejercicio"
        excludeIds={exercises.map((item) => item.exerciseId).filter(Boolean)}
        onClose={() => setAddingOpen(false)}
        onCreate={() => setExerciseCreatorOpen(true)}
        onSelect={(exercise) => {
          addExerciseToActiveWorkout(exercise.id);
          setAddingOpen(false);
        }}
      />

      <ExerciseSelector
        open={Boolean(replacing)}
        title="Cambiar ejercicio"
        excludeIds={exercises
          .filter((item) => item.workoutExerciseId !== replacing)
          .map((item) => item.exerciseId)
          .filter(Boolean)}
        onClose={() => setReplacing(null)}
        onSelect={(exercise) => {
          const targetId = replacing;
          if (targetId) {
            const mode = swapWorkoutExercise(targetId, exercise.id);
            if (mode === "replace") {
              setEditing(targetId);
            }
          }
          setReplacing(null);
        }}
      />
    </section>
  );
}

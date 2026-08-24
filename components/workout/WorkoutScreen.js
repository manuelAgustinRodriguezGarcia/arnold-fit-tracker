"use client";

import { useState } from "react";
import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  ChevronLeft,
  Pause,
  Play,
  Square,
  StretchHorizontal,
} from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Logo } from "@/components/ui/Logo";
import { Modal } from "@/components/ui/Modal";
import { ExerciseSelector } from "@/components/routines/ExerciseSelector";
import { ExerciseWorkoutEditor } from "@/components/workout/ExerciseWorkoutEditor";
import { RestTimerPill } from "@/components/workout/RestTimerPill";
import { WorkoutExercise } from "@/components/workout/WorkoutExercise";
import { useArnold } from "@/hooks/useArnold";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { EXERCISE_TYPE } from "@/lib/exercises";
import { STRETCH_PRESETS } from "@/lib/stretchPresets";
import { FATIGUE, WORKOUT_STATUS } from "@/lib/workout";
import styles from "./WorkoutScreen.module.css";

const FATIGUE_OPTIONS = [
  {
    value: FATIGUE.VERY_TIRED,
    label: "Muy cansado",
    Icon: BatteryLow,
  },
  {
    value: FATIGUE.TIRED,
    label: "Cansado",
    Icon: BatteryMedium,
  },
  {
    value: FATIGUE.REGULAR,
    label: "Regular",
    Icon: BatteryFull,
  },
];

export function WorkoutScreen({ onMinimize, onFinished }) {
  const {
    activeWorkout,
    pauseActiveWorkout,
    resumeActiveWorkout,
    toggleSetDone,
    beginTimedSet,
    markCurrentExercise,
    swapWorkoutExercise,
    finishWorkout,
    addExerciseToActiveWorkout,
  } = useArnold();
  const { display } = useWorkoutTimer(activeWorkout);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fatigueOpen, setFatigueOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [replacing, setReplacing] = useState(null);
  const [stretchOpen, setStretchOpen] = useState(false);
  useBodyScrollLock(Boolean(activeWorkout));

  if (!activeWorkout) {
    return null;
  }

  const paused = activeWorkout.status === WORKOUT_STATUS.PAUSED;
  const exercises = activeWorkout.exercises || [];

  function onToggleSet(exercise, set) {
    if (exercise.type === EXERCISE_TYPE.TIMED && !set.completed) {
      beginTimedSet(exercise.workoutExerciseId, set.id);
      return;
    }
    toggleSetDone(exercise.workoutExerciseId, set.id);
  }

  function onConfirmFinish() {
    setConfirmOpen(false);
    setFatigueOpen(true);
  }

  function onSelectFatigue(value) {
    const saved = finishWorkout(value);
    setFatigueOpen(false);
    if (saved) {
      onFinished();
    }
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Volver" onClick={onMinimize}>
          <ChevronLeft size={22} />
        </IconButton>
        <div className={styles.brand}>
          <Logo variant="wordmark" height={52} />
        </div>
        <span className={styles.spacer} />
      </header>

      <div className={styles.hero}>
        <p className={styles.kicker}>{activeWorkout.routineName}</p>
        <p className={styles.timer}>{display}</p>
        <p className={styles.status}>{paused ? "Pausado" : "En curso"}</p>
      </div>

      {activeWorkout.restTimer ? (
        <RestTimerPill restTimer={activeWorkout.restTimer} />
      ) : null}

      <ul className={styles.exercises}>
        {exercises.map((exercise) => (
          <li key={exercise.workoutExerciseId}>
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
      </ul>

      <div className={styles.stretchWrap}>
        <Button
          variant="secondary"
          size="lg"
          icon={<StretchHorizontal size={18} />}
          onClick={() => setStretchOpen(true)}
        >
          Elongación final
        </Button>
      </div>

      <div className={styles.controls}>
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
        <Button
          variant="danger"
          size="lg"
          icon={<Square size={16} />}
          onClick={() => setConfirmOpen(true)}
        >
          Finalizar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Finalizar entrenamiento"
        message="¿Querés terminar este entrenamiento y guardarlo?"
        confirmLabel="Finalizar"
        danger
        onConfirm={onConfirmFinish}
        onClose={() => setConfirmOpen(false)}
      />

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
              className={styles.fatigueCard}
              onClick={() => onSelectFatigue(option.value)}
            >
              <option.Icon size={26} />
              {option.label}
            </button>
          ))}
        </div>
      </Modal>

      {editing ? (
        <ExerciseWorkoutEditor
          exercise={exercises.find((item) => item.workoutExerciseId === editing)}
          onClose={() => setEditing(null)}
          onReplace={() => {
            setReplacing(editing);
            setEditing(null);
          }}
        />
      ) : null}

      <Modal
        open={stretchOpen}
        title="Elongación final"
        onClose={() => setStretchOpen(false)}
      >
        <div className={styles.stretchList}>
          {STRETCH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.stretchItem}
              onClick={() => {
                addExerciseToActiveWorkout(preset.id);
                setStretchOpen(false);
              }}
            >
              <strong>{preset.name}</strong>
              <span>
                {preset.defaultSets} × 1:30
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <ExerciseSelector
        open={Boolean(replacing)}
        title="Cambiar ejercicio"
        onClose={() => setReplacing(null)}
        onSelect={(exercise) => {
          if (replacing) {
            swapWorkoutExercise(replacing, exercise.id);
          }
          setReplacing(null);
        }}
      />
    </section>
  );
}
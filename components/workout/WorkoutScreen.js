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
} from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExerciseImage } from "@/components/ui/ExerciseImage";
import { Logo } from "@/components/ui/Logo";
import { Modal } from "@/components/ui/Modal";
import { useArnold } from "@/hooks/useArnold";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
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
    toggleExerciseDone,
    finishWorkout,
  } = useArnold();
  const { display } = useWorkoutTimer(activeWorkout);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fatigueOpen, setFatigueOpen] = useState(false);

  if (!activeWorkout) {
    return null;
  }

  const paused = activeWorkout.status === WORKOUT_STATUS.PAUSED;
  const exercises = activeWorkout.routineSnapshot?.exercises || [];
  const completedIds = activeWorkout.completedExerciseIds || [];

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

      <ul className={styles.exercises}>
        {exercises.map((exercise) => {
          const exerciseId = exercise.id || exercise.name;
          const done = completedIds.includes(exerciseId);

          return (
            <li key={exerciseId}>
              <button
                type="button"
                className={`${styles.exercise} ${done ? styles.done : ""}`}
                aria-pressed={done}
                onClick={() => toggleExerciseDone(exerciseId)}
              >
                <ExerciseImage
                  imagePath={exercise.imagePath}
                  name={exercise.name}
                  done={done}
                />
                <div>
                  <strong>{exercise.name}</strong>
                  {exercise.details ? <span>{exercise.details}</span> : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

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
    </section>
  );
}

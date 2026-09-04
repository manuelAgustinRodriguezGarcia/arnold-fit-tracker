"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BottomNav } from "@/components/navigation/BottomNav";
import { SplashScreen } from "@/components/splash/SplashScreen";
import { HomeView } from "@/components/home/HomeView";
import { RoutinesView } from "@/components/routines/RoutinesView";
import { ExerciseEditor } from "@/components/routines/ExerciseEditor";
import { RoutineForm } from "@/components/routines/RoutineForm";
import { StartWorkoutPicker } from "@/components/routines/StartWorkoutPicker";
import { ProgressView } from "@/components/progress/ProgressView";
import { SessionDetail } from "@/components/progress/SessionDetail";
import { WorkoutScreen } from "@/components/workout/WorkoutScreen";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { SpotifyController } from "@/components/spotify/SpotifyController";
import { useArnold } from "@/hooks/useArnold";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useSpotify } from "@/context/SpotifyContext";
import { NAV_VIEWS, pathToView, viewToPath } from "@/lib/navigation";
import styles from "./AppShell.module.css";

export function AppShell() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const view = pathToView(pathname);
  const {
    isReady,
    activeWorkout,
    deleteRoutine,
    deleteSession,
    deleteExercise,
    startWorkout,
    notice,
    clearNotice,
  } = useArnold();
  const { isExpanded: spotifyExpanded } = useSpotify();
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [formRoutine, setFormRoutine] = useState(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [exerciseForm, setExerciseForm] = useState(undefined);
  const [exerciseFormOpen, setExerciseFormOpen] = useState(false);
  const [stretchFormOpen, setStretchFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [activeConflict, setActiveConflict] = useState(false);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const shellRef = useRef(null);
  const overlayOpen =
    workoutOpen ||
    formOpen ||
    exerciseFormOpen ||
    stretchFormOpen ||
    pickerOpen ||
    Boolean(sessionDetail) ||
    Boolean(deleteTarget) ||
    Boolean(exerciseToDelete) ||
    Boolean(sessionToDelete) ||
    activeConflict ||
    settingsOpen ||
    spotifyExpanded;

  const navigateTo = useCallback(
    (nextView) => {
      const nextPath = viewToPath(nextView);
      if (nextPath !== pathname) {
        router.push(nextPath);
      }
    },
    [pathname, router],
  );

  useSwipeNavigation({
    targetRef: shellRef,
    view,
    views: NAV_VIEWS,
    onChange: navigateTo,
    enabled: isReady && !overlayOpen,
  });

  function openCreateForm() {
    setFormRoutine(null);
    setFormOpen(true);
    setPickerOpen(false);
  }

  function openEditForm(routine) {
    setFormRoutine(routine);
    setFormOpen(true);
  }

  function openCreateExercise() {
    setExerciseForm(null);
    setExerciseFormOpen(true);
  }

  function openCreateStretch() {
    setStretchFormOpen(true);
  }

  function openEditExercise(exercise) {
    setExerciseForm(exercise);
    setExerciseFormOpen(true);
  }

  function handleStart(routineId) {
    const result = startWorkout(routineId);
    if (result.code === "already-active") {
      setPickerOpen(false);
      setActiveConflict(true);
      return;
    }
    if (result.ok) {
      setPickerOpen(false);
      setWorkoutOpen(true);
    }
  }

  function handleQuickStart() {
    if (activeWorkout) {
      setWorkoutOpen(true);
      return;
    }
    setPickerOpen(true);
  }

  function handleWorkoutFinished() {
    setWorkoutOpen(false);
    router.push("/");
  }

  return (
    <>
      <div className={styles.shell} ref={shellRef}>
        <a className={styles.skip} href="#contenido">
          Saltar al contenido
        </a>
        {!workoutOpen ? <Header /> : null}
        <SplashScreen visible={!isReady} />
        {isReady ? (
          <main id="contenido" className={styles.main}>
            {view === "home" ? (
              <HomeView
                onCreateRoutine={openCreateForm}
                onStartWorkout={handleQuickStart}
                onContinueWorkout={() => setWorkoutOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            ) : null}
            {view === "routines" ? (
              <RoutinesView
                onCreate={openCreateForm}
                onEdit={openEditForm}
                onDelete={setDeleteTarget}
                onStart={handleStart}
                onCreateExercise={openCreateExercise}
                onCreateStretch={openCreateStretch}
                onEditExercise={openEditExercise}
                onDeleteExercise={setExerciseToDelete}
              />
            ) : null}
            {view === "progress" ? (
              <ProgressView
                onOpenSession={setSessionDetail}
                onDeleteSession={(session) => deleteSession(session.id)}
              />
            ) : null}
          </main>
        ) : (
          <main id="contenido" className={styles.main} />
        )}
        {isReady && !workoutOpen ? (
          <BottomNav />
        ) : null}
      </div>

      {workoutOpen && activeWorkout ? (
        <WorkoutScreen
          onMinimize={() => setWorkoutOpen(false)}
          onFinished={handleWorkoutFinished}
        />
      ) : null}

      {formOpen ? (
        <RoutineForm
          key={formRoutine?.id || "create"}
          routine={formRoutine}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
      {exerciseFormOpen ? (
        <ExerciseEditor
          key={exerciseForm?.id || "create-exercise"}
          exercise={exerciseForm}
          onClose={() => setExerciseFormOpen(false)}
        />
      ) : null}
      {stretchFormOpen ? (
        <ExerciseEditor
          key="create-stretch"
          asStretch
          onClose={() => setStretchFormOpen(false)}
        />
      ) : null}
      <StartWorkoutPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleStart}
        onCreate={openCreateForm}
      />
      <SessionDetail
        session={sessionDetail}
        onClose={() => setSessionDetail(null)}
        onDelete={(session) => {
          setSessionDetail(null);
          setSessionToDelete(session);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar rutina"
        message="¿Eliminar esta rutina? El historial de entrenamientos se conserva."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            deleteRoutine(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(exerciseToDelete)}
        title="Eliminar ejercicio"
        message="¿Eliminar este ejercicio de la biblioteca? Las rutinas lo van a perder, el historial se conserva."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (exerciseToDelete) {
            deleteExercise(exerciseToDelete.id);
          }
          setExerciseToDelete(null);
        }}
        onClose={() => setExerciseToDelete(null)}
      />
      <ConfirmDialog
        open={Boolean(sessionToDelete)}
        title="Eliminar entrenamiento"
        message="¿Eliminar este entrenamiento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete.id);
          }
          setSessionToDelete(null);
          setSessionDetail(null);
        }}
        onClose={() => setSessionToDelete(null)}
      />
      <ConfirmDialog
        open={activeConflict}
        title="Entrenamiento en curso"
        message="Ya hay un entrenamiento activo. Podés continuar el actual."
        confirmLabel="Continuar"
        onConfirm={() => {
          setActiveConflict(false);
          setWorkoutOpen(true);
        }}
        onClose={() => setActiveConflict(false)}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {isReady ? (
        <SpotifyController
          hidden={
            formOpen ||
            exerciseFormOpen ||
            pickerOpen ||
            Boolean(sessionDetail) ||
            Boolean(deleteTarget) ||
            Boolean(exerciseToDelete) ||
            Boolean(sessionToDelete) ||
            activeConflict ||
            settingsOpen
          }
          workoutOpen={workoutOpen}
        />
      ) : null}
      <Toast notice={notice} onClear={clearNotice} />
    </>
  );
}

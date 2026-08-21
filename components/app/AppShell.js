"use client";

import { useCallback, useRef, useState } from "react";
import { Header } from "@/components/ui/Header";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BottomNav, NAV_VIEWS } from "@/components/navigation/BottomNav";
import { SplashScreen } from "@/components/splash/SplashScreen";
import { HomeView } from "@/components/home/HomeView";
import { RoutinesView } from "@/components/routines/RoutinesView";
import { RoutineForm } from "@/components/routines/RoutineForm";
import { StartWorkoutPicker } from "@/components/routines/StartWorkoutPicker";
import { ProgressView } from "@/components/progress/ProgressView";
import { SessionDetail } from "@/components/progress/SessionDetail";
import { WorkoutScreen } from "@/components/workout/WorkoutScreen";
import { useArnold } from "@/hooks/useArnold";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import styles from "./AppShell.module.css";

export function AppShell() {
  const { isReady, activeWorkout, deleteRoutine, startWorkout, notice, clearNotice } =
    useArnold();
  const [view, setView] = useState("home");
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [formRoutine, setFormRoutine] = useState(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeConflict, setActiveConflict] = useState(false);
  const [sessionDetail, setSessionDetail] = useState(null);
  const shellRef = useRef(null);
  const overlayOpen =
    workoutOpen ||
    formOpen ||
    pickerOpen ||
    Boolean(sessionDetail) ||
    Boolean(deleteTarget) ||
    activeConflict;

  const navigateTo = useCallback((nextView) => {
    setView(nextView);
  }, []);

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
    setView("home");
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
              />
            ) : null}
            {view === "routines" ? (
              <RoutinesView
                onCreate={openCreateForm}
                onEdit={openEditForm}
                onDelete={setDeleteTarget}
                onStart={handleStart}
              />
            ) : null}
            {view === "progress" ? (
              <ProgressView onOpenSession={setSessionDetail} />
            ) : null}
          </main>
        ) : (
          <main id="contenido" className={styles.main} />
        )}
        {isReady && !workoutOpen ? (
          <BottomNav view={view} onChange={navigateTo} />
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
      <StartWorkoutPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleStart}
        onCreate={openCreateForm}
      />
      <SessionDetail
        session={sessionDetail}
        onClose={() => setSessionDetail(null)}
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
      <Toast notice={notice} onClear={clearNotice} />
    </>
  );
}

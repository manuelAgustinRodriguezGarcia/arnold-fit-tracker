"use client";

import { useEffect, useRef, useState } from "react";
import { Dumbbell, ListTodo, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExerciseLibrary } from "@/components/routines/ExerciseLibrary";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { useArnold } from "@/hooks/useArnold";
import styles from "./RoutinesView.module.css";

export function RoutinesView({
  onCreate,
  onEdit,
  onDelete,
  onStart,
  onCreateExercise,
  onEditExercise,
  onDeleteExercise,
}) {
  const { routines } = useArnold();
  const [tab, setTab] = useState("routines");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuClosing = menuVisible && !menuOpen;
  const fabWrapRef = useRef(null);

  function openMenu() {
    setMenuVisible(true);
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMenuVisible(false);
    }
  }

  useEffect(() => {
    if (menuOpen || !menuVisible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMenuVisible(false);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [menuOpen, menuVisible]);

  useEffect(() => {
    if (!menuVisible) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    function onPointerDown(event) {
      if (fabWrapRef.current?.contains(event.target)) {
        return;
      }
      closeMenu();
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuVisible]);

  function choose(action) {
    closeMenu();
    action();
  }

  return (
    <>
      <section className={styles.view}>
        <div className={styles.tabs} role="tablist" aria-label="Sección rutinas">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "routines"}
            className={styles.tab}
            onClick={() => setTab("routines")}
          >
            Rutinas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "exercises"}
            className={styles.tab}
            onClick={() => setTab("exercises")}
          >
            Ejercicios
          </button>
        </div>

        {tab === "routines" ? (
          routines.length === 0 ? (
            <EmptyState title="Todavía no tenés rutinas" />
          ) : (
            <div className={styles.list}>
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onStart={() => onStart(routine.id)}
                  onEdit={() => onEdit(routine)}
                  onDelete={() => onDelete(routine)}
                />
              ))}
            </div>
          )
        ) : (
          <ExerciseLibrary
            onCreate={onCreateExercise}
            onEdit={onEditExercise}
            onDelete={onDeleteExercise}
          />
        )}
      </section>

      <div className={styles.fabWrap} ref={fabWrapRef}>
        {menuVisible ? (
          <div className={`${styles.actions} ${menuClosing ? styles.actionsClosing : ""}`} role="menu">
            <button
              type="button"
              role="menuitem"
              className={`${styles.action} ${menuClosing ? styles.actionClosing : ""}`}
              onClick={() => choose(onCreate)}
            >
              <ListTodo size={18} />
              Nueva rutina
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${styles.action} ${menuClosing ? styles.actionClosing : ""}`}
              onClick={() => choose(onCreateExercise)}
            >
              <Dumbbell size={18} />
              Nuevo ejercicio
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className={`${styles.fab} ${menuOpen ? styles.fabOpen : ""}`}
          aria-label={menuOpen ? "Cerrar menú" : "Crear"}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
        >
          <Plus size={26} strokeWidth={2.4} />
        </button>
      </div>
    </>
  );
}
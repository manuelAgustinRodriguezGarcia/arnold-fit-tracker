"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

const LONG_PRESS_MS = 360;
const MOVE_CANCEL_PX = 12;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function targetIndexFromY(list, clientY) {
  const rows = [...list.querySelectorAll("[data-exercise-row]")];
  if (rows.length === 0) {
    return 0;
  }

  for (let index = 0; index < rows.length; index += 1) {
    const rect = rows[index].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return index;
    }
  }

  return rows.length - 1;
}

export function useWorkoutExerciseReorder({
  listRef,
  orderedIds,
  onReorder,
  enabled = true,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef(null);
  const orderedIdsRef = useRef(orderedIds);
  const onReorderRef = useRef(onReorder);
  const reorderingRef = useRef(false);

  orderedIdsRef.current = orderedIds;
  onReorderRef.current = onReorder;

  useEffect(() => {
    if (!draggingId) {
      return undefined;
    }

    function preventScroll(event) {
      if (event.cancelable) {
        event.preventDefault();
      }
    }

    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [draggingId]);

  function clearPressTimer() {
    const state = dragRef.current;
    if (state?.pressTimer) {
      window.clearTimeout(state.pressTimer);
      state.pressTimer = 0;
    }
  }

  function endDrag() {
    clearPressTimer();
    const state = dragRef.current;
    if (state?.pointerId != null && state.row) {
      try {
        state.row.releasePointerCapture(state.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
    setDraggingId(null);
    reorderingRef.current = false;
  }

  function moveToIndex(nextIndex) {
    const state = dragRef.current;
    const list = listRef.current;
    if (!state?.activated || !list || reorderingRef.current) {
      return;
    }

    const ids = [...orderedIdsRef.current];
    const fromIndex = ids.indexOf(state.id);
    if (fromIndex < 0 || nextIndex < 0 || nextIndex >= ids.length) {
      return;
    }
    if (fromIndex === nextIndex) {
      return;
    }

    const [item] = ids.splice(fromIndex, 1);
    ids.splice(nextIndex, 0, item);

    const animate = !prefersReducedMotion();
    const flipState = animate
      ? Flip.getState(list.querySelectorAll("[data-exercise-row]"))
      : null;

    reorderingRef.current = true;
    flushSync(() => {
      onReorderRef.current(ids);
    });
    state.index = nextIndex;

    if (!flipState) {
      reorderingRef.current = false;
      return;
    }

    Flip.from(flipState, {
      duration: 0.24,
      ease: "power2.out",
      absolute: false,
      nested: true,
      simple: true,
      scale: false,
      onComplete: () => {
        reorderingRef.current = false;
      },
    });
  }

  function onPointerDown(event, exerciseId) {
    if (!enabled || orderedIdsRef.current.length < 2) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    if (event.target.closest("button, a, input, textarea, label")) {
      return;
    }

    const row = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;

    clearPressTimer();
    dragRef.current = {
      id: exerciseId,
      row,
      pointerId,
      startX,
      startY,
      activated: false,
      index: orderedIdsRef.current.indexOf(exerciseId),
      pressTimer: window.setTimeout(() => {
        const state = dragRef.current;
        if (!state || state.id !== exerciseId) {
          return;
        }
        state.activated = true;
        setDraggingId(exerciseId);
        try {
          row.setPointerCapture(pointerId);
        } catch {
          /* ignore */
        }
        try {
          navigator.vibrate?.(10);
        } catch {
          /* ignore */
        }
      }, LONG_PRESS_MS),
    };

    function onPointerMove(moveEvent) {
      const state = dragRef.current;
      if (!state || state.pointerId !== pointerId) {
        return;
      }

      const dx = moveEvent.clientX - state.startX;
      const dy = moveEvent.clientY - state.startY;

      if (!state.activated) {
        if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
          clearPressTimer();
          dragRef.current = null;
        }
        return;
      }

      moveEvent.preventDefault();
      const list = listRef.current;
      if (!list) {
        return;
      }
      const nextIndex = targetIndexFromY(list, moveEvent.clientY);
      moveToIndex(nextIndex);
    }

    function onPointerUp(upEvent) {
      if (upEvent.pointerId !== pointerId) {
        return;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      endDrag();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  return {
    draggingId,
    onPointerDown,
    isDragging: Boolean(draggingId),
  };
}

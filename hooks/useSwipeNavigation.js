"use client";

import { useEffect } from "react";

const MIN_DISTANCE = 56;
const HORIZONTAL_RATIO = 1.35;

export function useSwipeNavigation({
  targetRef,
  view,
  views,
  onChange,
  enabled = true,
}) {
  useEffect(() => {
    const node = targetRef.current;
    if (!enabled || !node) {
      return undefined;
    }

    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(event) {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }

      const target = event.target;
      if (
        !(target instanceof Element) ||
        target.closest("input, textarea, select, [role='dialog'], nav")
      ) {
        tracking = false;
        return;
      }

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    }

    function onTouchEnd(event) {
      if (!tracking) {
        return;
      }
      tracking = false;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Math.abs(dx) < MIN_DISTANCE) {
        return;
      }
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) {
        return;
      }

      const index = views.indexOf(view);
      if (index < 0) {
        return;
      }

      if (dx < 0 && index < views.length - 1) {
        onChange(views[index + 1]);
        return;
      }
      if (dx > 0 && index > 0) {
        onChange(views[index - 1]);
      }
    }

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchend", onTouchEnd);
    };
  }, [targetRef, view, views, onChange, enabled]);
}

"use client";

import { useEffect, useState } from "react";
import { formatTimer } from "@/lib/dates";
import { getElapsedMilliseconds, WORKOUT_STATUS } from "@/lib/workout";

export function useWorkoutTimer(workout) {
  const [now, setNow] = useState(() => Date.now());
  const status = workout?.status;
  const workoutId = workout?.id;
  const pausedAt = workout?.pausedAt;

  useEffect(() => {
    if (!workoutId || status !== WORKOUT_STATUS.RUNNING) {
      return undefined;
    }

    function refresh() {
      setNow(Date.now());
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }

    refresh();
    const intervalId = window.setInterval(refresh, 250);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [workoutId, status, pausedAt]);

  const elapsedMs = workout ? getElapsedMilliseconds(workout, now) : 0;

  return {
    elapsedMs,
    display: formatTimer(elapsedMs),
  };
}

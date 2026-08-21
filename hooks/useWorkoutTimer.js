"use client";

import { useEffect, useState } from "react";
import { formatTimer } from "@/lib/dates";
import { getElapsedMilliseconds, WORKOUT_STATUS } from "@/lib/workout";

export function useWorkoutTimer(workout) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!workout) {
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

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);

    if (workout.status !== WORKOUT_STATUS.RUNNING) {
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("focus", refresh);
      };
    }

    const intervalId = window.setInterval(refresh, 250);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [workout, workout?.id, workout?.status, workout?.pausedAt]);

  const elapsedMs = workout ? getElapsedMilliseconds(workout, now) : 0;

  return {
    elapsedMs,
    display: formatTimer(elapsedMs),
  };
}

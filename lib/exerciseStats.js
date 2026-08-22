import { namesMatch } from "./exercises";
import { getPeriodRange, isInRange } from "./dates";
import { getSessionExercises } from "./workout";
import {
  getBestDuration,
  getCompletedSets,
  getExerciseDuration,
  getExerciseVolume,
  getLastWeight,
  getMaxWeight,
} from "./workoutSets";

export function getSessionVolume(session) {
  return getSessionExercises(session).reduce(
    (total, exercise) => total + getExerciseVolume(exercise),
    0,
  );
}

export function getSessionCompletedSetCount(session) {
  return getSessionExercises(session).reduce(
    (total, exercise) => total + getCompletedSets(exercise).length,
    0,
  );
}

export function getSessionPerformedExerciseCount(session) {
  const exercises = getSessionExercises(session);
  const performed = exercises.filter((exercise) => getCompletedSets(exercise).length > 0);
  if (performed.length > 0) {
    return performed.length;
  }
  return Number(session.exerciseCount) || exercises.length;
}

export function getPeriodSessions(sessions, period, offset = 0, now = new Date()) {
  const range = getPeriodRange(period, offset, now);
  return (sessions || []).filter((session) =>
    isInRange(session.endedAt || session.startedAt, range),
  );
}

export function getPeriodMetrics(sessions) {
  return {
    trainings: sessions.length,
    exercises: sessions.reduce(
      (total, session) => total + getSessionPerformedExerciseCount(session),
      0,
    ),
    durationSeconds: sessions.reduce(
      (total, session) => total + (Number(session.durationSeconds) || 0),
      0,
    ),
    volumeKg: sessions.reduce((total, session) => total + getSessionVolume(session), 0),
  };
}

export function getTimeByRoutine(sessions) {
  const map = new Map();
  for (const session of sessions || []) {
    const key = session.routineId || session.routineName || "otro";
    const current = map.get(key) || {
      id: key,
      name: session.routineName || "Rutina",
      durationSeconds: 0,
    };
    current.durationSeconds += Number(session.durationSeconds) || 0;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.durationSeconds - a.durationSeconds);
}

export function getActivityByDay(sessions, range) {
  const days = [];
  const cursor = new Date(range.start);
  while (cursor <= range.end) {
    const dayStart = new Date(cursor);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);
    const durationSeconds = (sessions || [])
      .filter((session) => {
        const date = new Date(session.endedAt || session.startedAt);
        return date >= dayStart && date <= dayEnd;
      })
      .reduce((total, session) => total + (Number(session.durationSeconds) || 0), 0);
    days.push({
      date: new Date(dayStart),
      durationSeconds,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function getActivityByWeek(sessions, range) {
  const weeks = [];
  const cursor = new Date(range.start);
  let index = 1;
  while (cursor <= range.end) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > range.end) {
      weekEnd.setTime(range.end.getTime());
    }
    weekEnd.setHours(23, 59, 59, 999);
    const durationSeconds = (sessions || [])
      .filter((session) => {
        const date = new Date(session.endedAt || session.startedAt);
        return date >= weekStart && date <= weekEnd;
      })
      .reduce((total, session) => total + (Number(session.durationSeconds) || 0), 0);
    weeks.push({
      label: `S${index}`,
      durationSeconds,
    });
    cursor.setDate(cursor.getDate() + 7);
    index += 1;
  }
  return weeks;
}

export function exerciseMatches(exercise, exerciseId, name) {
  if (exerciseId && exercise.exerciseId === exerciseId) {
    return true;
  }
  if (name) {
    return namesMatch(exercise.name, name);
  }
  return false;
}

export function getExerciseHistory(sessions, exerciseId, name) {
  const ordered = [...(sessions || [])].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  return ordered
    .map((session) => {
      const matches = getSessionExercises(session).filter((exercise) =>
        exerciseMatches(exercise, exerciseId, name),
      );
      if (matches.length === 0) {
        return null;
      }
      const volumeKg = matches.reduce((total, exercise) => total + getExerciseVolume(exercise), 0);
      const sets = matches.flatMap((exercise) => getCompletedSets(exercise));
      return {
        sessionId: session.id,
        startedAt: session.startedAt,
        routineName: session.routineName,
        exercises: matches,
        sets,
        volumeKg,
        maxWeight: matches.reduce((max, exercise) => {
          const value = getMaxWeight(exercise);
          if (value == null) {
            return max;
          }
          return max == null ? value : Math.max(max, value);
        }, null),
        lastWeight: matches.reduce((last, exercise) => getLastWeight(exercise) ?? last, null),
        durationSeconds: matches.reduce(
          (total, exercise) => total + getExerciseDuration(exercise),
          0,
        ),
        bestDuration: matches.reduce((best, exercise) => {
          const value = getBestDuration(exercise);
          if (value == null) {
            return best;
          }
          return best == null ? value : Math.max(best, value);
        }, null),
        type: matches[0]?.type || "reps",
      };
    })
    .filter(Boolean);
}

export function getExerciseProgressSummary(history) {
  if (!history.length) {
    return null;
  }
  const last = history[history.length - 1];
  const allSets = history.flatMap((entry) => entry.sets);
  const maxWeight = history.reduce((max, entry) => {
    if (entry.maxWeight == null) {
      return max;
    }
    return max == null ? entry.maxWeight : Math.max(max, entry.maxWeight);
  }, null);

  return {
    trainings: history.length,
    sets: allSets.length,
    reps: allSets.reduce((total, set) => total + (Number(set.reps) || 0), 0),
    volumeKg: history.reduce((total, entry) => total + entry.volumeKg, 0),
    maxWeight,
    lastWeight: last.lastWeight,
    durationSeconds: history.reduce((total, entry) => total + entry.durationSeconds, 0),
    bestDuration: history.reduce((best, entry) => {
      if (entry.bestDuration == null) {
        return best;
      }
      return best == null ? entry.bestDuration : Math.max(best, entry.bestDuration);
    }, null),
    type: last.type,
  };
}

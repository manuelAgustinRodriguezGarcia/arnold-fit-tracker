export const DATE_LOCALE = "es-AR";

export function nowIso(date = new Date()) {
  return date.toISOString();
}

export function toDate(value) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

export function getCurrentWeekRange(now = new Date()) {
  const date = toDate(now);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function isInCurrentWeek(value, now = new Date()) {
  const date = toDate(value);
  const { start, end } = getCurrentWeekRange(now);
  return date >= start && date <= end;
}

export function getDayPeriod(value) {
  const date = toDate(value);
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (minutes >= 5 * 60 && minutes < 12 * 60) {
    return "a la mañana";
  }
  if (minutes >= 12 * 60 && minutes < 19 * 60) {
    return "por la tarde";
  }
  return "por la noche";
}

export function getWeekdayName(value) {
  const weekday = toDate(value).toLocaleDateString(DATE_LOCALE, {
    weekday: "long",
  });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function getTrainingTitle(value) {
  return `Training ${getWeekdayName(value)} ${getDayPeriod(value)}`;
}

export function formatDate(value) {
  return toDate(value).toLocaleDateString(DATE_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(value) {
  return toDate(value).toLocaleTimeString(DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value) {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function formatDurationHuman(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}min`;
  }
  return `${total}s`;
}

export function formatTimer(milliseconds) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function getWeeklyStats(sessions, now = new Date()) {
  const weekSessions = sessions.filter((session) =>
    isInCurrentWeek(session.endedAt || session.startedAt, now),
  );

  return {
    trainings: weekSessions.length,
    exercises: weekSessions.reduce(
      (total, session) => total + (Number(session.exerciseCount) || 0),
      0,
    ),
    durationSeconds: weekSessions.reduce(
      (total, session) => total + (Number(session.durationSeconds) || 0),
      0,
    ),
  };
}

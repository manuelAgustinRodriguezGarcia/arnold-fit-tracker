import { createId } from "./ids";
import { nowIso } from "./dates";

export const EXERCISE_TYPE = {
  REPS: "reps",
  TIMED: "timed",
};

export const DEFAULT_REST_SECONDS = 90;

const DETAILS_RE =
  /^(\d+)\s*[x×]\s*(\d+)(?:\s*[-–—]\s*(\d+))?(?:\s*(s|seg|segs|segundos?))?$/i;

const NAME_ALIASES = {
  "press banca plano con barra olimpica": "press banca plana con barra olimpica",
  "press banca plana con barra olimpica": "press banca plana con barra olimpica",
  aperturas: "apertura de pecho",
  "apertura de pecho": "apertura de pecho",
  "triceps en polea": "triceps en poleas",
  "triceps en poleas": "triceps en poleas",
  "jalon al pecho": "jalon al pecho con barra",
  "jalon al pecho con barra": "jalon al pecho con barra",
  prensa: "prensa horizontal",
  "prensa horizontal": "prensa horizontal",
  "curl femoral": "curl femoral acostado",
  "curl femoral acostado": "curl femoral acostado",
  pantorrillas: "elevaciones de pantorrillas",
  "elevaciones de pantorrillas": "elevaciones de pantorrillas",
  "elevaciones laterales": "vuelos laterales con mancuernas",
  "vuelos laterales con mancuernas": "vuelos laterales con mancuernas",
  "press de hombros": "press de hombros en maquina",
  "press de hombros en maquina": "press de hombros en maquina",
  "curl de biceps": "curl tradicional con mancuernas",
  "curl tradicional con mancuernas": "curl tradicional con mancuernas",
  "press inclinado con mancuernas": "press inclinado de pecho con mancuerna",
  "press inclinado de pecho con mancuerna": "press inclinado de pecho con mancuerna",
  "press de pecho": "press inclinado de pecho con mancuerna",
};

export function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalNameKey(name) {
  const key = normalizeName(name);
  return NAME_ALIASES[key] || key;
}

export function namesMatch(a, b) {
  return canonicalNameKey(a) === canonicalNameKey(b);
}

export function parseExerciseDetails(details) {
  const text = String(details || "").trim();
  if (!text) {
    return { parsed: false, notes: null };
  }

  const normalized = text.replace(/\s+/g, " ");
  const match = normalized.match(DETAILS_RE);
  if (!match) {
    return { parsed: false, notes: text };
  }

  const sets = Number(match[1]);
  const first = Number(match[2]);
  const second = match[3] ? Number(match[3]) : first;
  const timedBySuffix = Boolean(match[4]);
  const timedByWord = /segundo/i.test(normalized);
  const isTimed = timedBySuffix || timedByWord;

  if (isTimed) {
    return {
      parsed: true,
      type: EXERCISE_TYPE.TIMED,
      defaultSets: sets,
      defaultDurationSeconds: second,
      durationRange: { min: first, max: second },
      notes: null,
    };
  }

  return {
    parsed: true,
    type: EXERCISE_TYPE.REPS,
    defaultSets: sets,
    defaultReps: { min: first, max: second },
    notes: null,
  };
}

export function createExerciseRecord(input = {}) {
  const now = nowIso();
  const type = input.type === EXERCISE_TYPE.TIMED ? EXERCISE_TYPE.TIMED : EXERCISE_TYPE.REPS;
  const defaultSets = Math.max(1, Number(input.defaultSets) || 3);
  const restRaw = Number(input.restSeconds);
  const restSeconds =
    Number.isFinite(restRaw) && restRaw >= 0 ? Math.round(restRaw) : DEFAULT_REST_SECONDS;

  return {
    id: input.id || createId(),
    name: String(input.name || "").trim(),
    type,
    defaultSets,
    defaultReps:
      type === EXERCISE_TYPE.REPS
        ? normalizeReps(input.defaultReps)
        : null,
    defaultWeightKg:
      type === EXERCISE_TYPE.REPS ? normalizeWeight(input.defaultWeightKg) : null,
    restSeconds,
    defaultDurationSeconds:
      type === EXERCISE_TYPE.TIMED
        ? Math.max(1, Number(input.defaultDurationSeconds) || 60)
        : null,
    durationRange:
      type === EXERCISE_TYPE.TIMED ? normalizeDurationRange(input.durationRange) : null,
    imagePath: input.imagePath || null,
    notes: input.notes || null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function normalizeReps(reps) {
  if (typeof reps === "number" && Number.isFinite(reps) && reps > 0) {
    const value = Math.round(reps);
    return { min: value, max: value };
  }
  if (!reps || typeof reps !== "object") {
    return { min: 10, max: 10 };
  }
  const min = Math.max(1, Math.round(Number(reps.min) || Number(reps.max) || 10));
  const max = Math.max(min, Math.round(Number(reps.max) || min));
  return { min, max };
}

export function normalizeWeight(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function normalizeDurationRange(range) {
  if (!range || typeof range !== "object") {
    return null;
  }
  const min = Math.max(1, Math.round(Number(range.min) || 0));
  const max = Math.max(min, Math.round(Number(range.max) || min));
  return { min, max };
}

export function parseWeightInput(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  if (parsed === 0) {
    return null;
  }
  return parsed;
}

export function parseRepsInput(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(parsed);
}

export function findExerciseByName(exercises, name) {
  const key = canonicalNameKey(name);
  return (exercises || []).find((exercise) => canonicalNameKey(exercise.name) === key) || null;
}

export function findExerciseById(exercises, id) {
  return (exercises || []).find((exercise) => exercise.id === id) || null;
}

export function resolveRoutineExercises(routine, library) {
  return (routine?.exercises || [])
    .map((item, index) => {
      if (item?.exerciseId) {
        const exercise = findExerciseById(library, item.exerciseId);
        if (!exercise) {
          return null;
        }
        return {
          ...exercise,
          exerciseId: exercise.id,
          order: item.order ?? index,
        };
      }
      if (item?.name) {
        const matched = findExerciseByName(library, item.name);
        const parsed = parseExerciseDetails(item.details);
        const fallback = createExerciseRecord({
          id: item.id,
          name: item.name,
          type: parsed.parsed ? parsed.type : EXERCISE_TYPE.REPS,
          defaultSets: parsed.defaultSets,
          defaultReps: parsed.defaultReps,
          defaultDurationSeconds: parsed.defaultDurationSeconds,
          durationRange: parsed.durationRange,
          notes: parsed.notes || item.details || null,
          imagePath: item.imagePath || null,
        });
        const exercise = matched || fallback;
        return {
          ...exercise,
          exerciseId: exercise.id,
          order: item.order ?? index,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function formatExerciseType(type) {
  return type === EXERCISE_TYPE.TIMED ? "Por tiempo" : "Series y reps";
}

export function formatReps(reps) {
  if (!reps) {
    return "—";
  }
  if (reps.min === reps.max) {
    return String(reps.min);
  }
  return `${reps.min}–${reps.max}`;
}

export function formatSeconds(value) {
  const total = Math.max(0, Math.round(Number(value) || 0));
  if (total < 60) {
    return `${total} s`;
  }
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (seconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDurationRange(exercise) {
  if (exercise?.durationRange && exercise.durationRange.min !== exercise.durationRange.max) {
    return `${exercise.durationRange.min}–${exercise.durationRange.max} s`;
  }
  return formatSeconds(exercise?.defaultDurationSeconds);
}

export function formatExerciseSummary(exercise) {
  if (!exercise) {
    return "";
  }

  const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
  const setCount = sets.length > 0 ? sets.length : exercise.defaultSets;

  if (exercise.type === EXERCISE_TYPE.TIMED) {
    const durations = sets
      .map((set) => set.durationSeconds)
      .filter((value) => value != null && Number.isFinite(Number(value)))
      .map((value) => Math.round(Number(value)));
    let durationLabel = formatDurationRange(exercise);
    if (durations.length > 0) {
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      durationLabel = min === max ? formatSeconds(min) : `${min}–${max} s`;
    }
    return `${setCount} series · ${durationLabel} · ${exercise.restSeconds} s descanso`;
  }

  const repsValues = sets
    .map((set) => set.reps)
    .filter((value) => value != null && Number.isFinite(Number(value)))
    .map((value) => Math.round(Number(value)));
  const repsLabel =
    repsValues.length > 0
      ? formatReps({
          min: Math.min(...repsValues),
          max: Math.max(...repsValues),
        })
      : formatReps(exercise.defaultReps);

  const weights = sets.map((set) => set.weightKg);
  const hasSetWeight = weights.some((value) => value != null);
  const sameWeight = hasSetWeight && weights.every((value) => value === weights[0]);
  const weightValue = hasSetWeight
    ? sameWeight
      ? weights[0]
      : weights.find((value) => value != null)
    : exercise.defaultWeightKg;
  const weight = weightValue != null ? ` · ${weightValue} KG` : "";

  return `${setCount} series · ${repsLabel} reps · ${exercise.restSeconds} s${weight}`;
}

export function formatCurrentSetSummary(exercise) {
  if (!exercise) {
    return "";
  }

  const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
  const focus = sets.find((set) => !set.completed) || sets[sets.length - 1] || null;
  if (!focus) {
    return formatExerciseSummary(exercise);
  }

  const rest = `${exercise.restSeconds ?? 90} s`;

  if (exercise.type === EXERCISE_TYPE.TIMED) {
    const duration =
      focus.durationSeconds != null && Number.isFinite(Number(focus.durationSeconds))
        ? formatSeconds(focus.durationSeconds)
        : formatDurationRange(exercise);
    return `${duration} · ${rest}`;
  }

  const reps =
    focus.reps != null && Number.isFinite(Number(focus.reps))
      ? String(Math.round(Number(focus.reps)))
      : formatReps(exercise.defaultReps);
  const weight =
    focus.weightKg != null && Number.isFinite(Number(focus.weightKg))
      ? ` · ${focus.weightKg} KG`
      : exercise.defaultWeightKg != null
        ? ` · ${exercise.defaultWeightKg} KG`
        : "";

  return `${reps} reps${weight} · ${rest}`;
}

export function splitSeconds(total) {
  const value = Math.max(0, Math.round(Number(total) || 0));
  return {
    minutes: Math.floor(value / 60),
    seconds: value % 60,
  };
}

export function combineSeconds(minutes, seconds) {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  const secs = Math.max(0, Math.round(Number(seconds) || 0));
  return Math.max(1, mins * 60 + secs);
}

export function getDefaultRepsValue(exercise) {
  return exercise?.defaultReps?.max || exercise?.defaultReps?.min || 10;
}

export function getDefaultDurationValue(exercise) {
  return (
    exercise?.defaultDurationSeconds ||
    exercise?.durationRange?.max ||
    exercise?.durationRange?.min ||
    60
  );
}

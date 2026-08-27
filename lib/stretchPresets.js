export const STRETCH_PRESETS = [
  {
    id: "ex-elong-gemelos",
    name: "Gemelos / pantorrillas",
    defaultSets: 3,
  },
  {
    id: "ex-elong-biceps",
    name: "Elongación de bíceps",
    defaultSets: 2,
  },
  {
    id: "ex-elong-triceps",
    name: "Elongación de tríceps",
    defaultSets: 2,
  },
  {
    id: "ex-elong-abdominal",
    name: "Elongación abdominal",
    defaultSets: 1,
  },
  {
    id: "ex-elong-cuadriceps",
    name: "Elongación de cuádriceps Izq. y Der.",
    defaultSets: 2,
  },
  {
    id: "ex-elong-isquiotibiales",
    name: "Elongación de isquiotibiales Izq. y Der.",
    defaultSets: 2,
  },
];

export function isStretchExercise(exercise) {
  const id = exercise?.exerciseId || exercise?.id || "";
  return String(id).startsWith("ex-elong-");
}

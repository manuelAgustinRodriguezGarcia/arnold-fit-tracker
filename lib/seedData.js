function exercise(id, name, details, order) {
  return {
    id,
    name,
    details,
    imagePath: null,
    order,
  };
}

export const SEED_ROUTINES = [
  {
    id: "seed-pecho-triceps",
    name: "Pecho + tríceps",
    description: "Pecho y tríceps",
    exercises: [
      exercise(
        "seed-pecho-triceps-1",
        "Press banca plano con barra olímpica",
        "3 x 8-10",
        0,
      ),
      exercise("seed-pecho-triceps-2", "Press de pecho", "3 x 10-12", 1),
      exercise("seed-pecho-triceps-3", "Aperturas", "3 x 10-12", 2),
      exercise("seed-pecho-triceps-4", "Tríceps en polea", "3 x 10-12", 3),
      exercise("seed-pecho-triceps-5", "Extensión de tríceps", "3 x 10-12", 4),
      exercise("seed-pecho-triceps-6", "Correr", "Al finalizar", 5),
    ],
  },
  {
    id: "seed-espalda-biceps",
    name: "Espalda + bíceps",
    description: "Espalda y bíceps",
    exercises: [
      exercise("seed-espalda-biceps-1", "Jalón al pecho", "3 x 10-12", 0),
      exercise("seed-espalda-biceps-2", "Remo sentado", "3 x 10-12", 1),
      exercise("seed-espalda-biceps-3", "Remo en máquina", "3 x 10-12", 2),
      exercise("seed-espalda-biceps-4", "Curl de bíceps", "3 x 10-12", 3),
      exercise("seed-espalda-biceps-5", "Curl martillo", "3 x 10-12", 4),
      exercise("seed-espalda-biceps-6", "Correr", "Al finalizar", 5),
    ],
  },
  {
    id: "seed-piernas-hombros",
    name: "Piernas + hombros",
    description: "Piernas y hombros",
    exercises: [
      exercise("seed-piernas-hombros-1", "Prensa", "3 x 10-12", 0),
      exercise("seed-piernas-hombros-2", "Extensión de cuádriceps", "3 x 10-12", 1),
      exercise("seed-piernas-hombros-3", "Curl femoral", "3 x 10-12", 2),
      exercise("seed-piernas-hombros-4", "Press de hombros", "3 x 10-12", 3),
      exercise("seed-piernas-hombros-5", "Elevaciones laterales", "3 x 12", 4),
      exercise("seed-piernas-hombros-6", "Pantorrillas", "3 x 12-15", 5),
      exercise("seed-piernas-hombros-7", "Correr", "Al finalizar", 6),
    ],
  },
];

export const NAV_VIEWS = ["home", "routines", "progress"];

export const NAV_ITEMS = [
  { id: "home", href: "/", label: "Inicio" },
  { id: "routines", href: "/rutinas", label: "Rutinas" },
  { id: "progress", href: "/progreso", label: "Progreso" },
];

export function pathToView(pathname) {
  switch (pathname) {
    case "/rutinas":
      return "routines";
    case "/progreso":
      return "progress";
    case "/":
      return "home";
    default:
      return "home";
  }
}

export function viewToPath(view) {
  switch (view) {
    case "home":
      return "/";
    case "routines":
      return "/rutinas";
    case "progress":
      return "/progreso";
    default:
      return "/";
  }
}

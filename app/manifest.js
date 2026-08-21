export default function manifest() {
  return {
    name: "Arnold",
    short_name: "Arnold",
    description: "Organizá tus rutinas de gimnasio y registrá tus entrenamientos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    background_color: "#F3F0E9",
    theme_color: "#F3F0E9",
    icons: [
      {
        src: "/logo-square-arnold.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo-square-arnold-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-square-arnold-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-square-arnold-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

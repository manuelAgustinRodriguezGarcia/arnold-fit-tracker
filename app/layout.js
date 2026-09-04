import { Source_Sans_3 } from "next/font/google";
import { AppClient } from "@/components/app/AppClient";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://arnold-ten.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Arnold",
    template: "%s · Arnold",
  },
  description: "Organizá tus rutinas de gimnasio y registrá tus entrenamientos.",
  applicationName: "Arnold",
  appleWebApp: {
    capable: true,
    title: "Arnold",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/logo-square-arnold.svg", type: "image/svg+xml" },
      { url: "/logo-square-arnold-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-square-arnold-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Arnold",
    description: "Organizá tus rutinas de gimnasio y registrá tus entrenamientos.",
    type: "website",
    locale: "es_AR",
    siteName: "Arnold",
  },
  twitter: {
    card: "summary",
    title: "Arnold",
    description: "Organizá tus rutinas de gimnasio y registrá tus entrenamientos.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F0E9" },
    { media: "(prefers-color-scheme: dark)", color: "#171512" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
};

const THEME_BOOT = `(function(){try{var raw=localStorage.getItem("arnold:v1");var theme="classic";var appearance="light";if(raw){var parsed=JSON.parse(raw);var s=parsed&&parsed.settings;if(s){var p=s.themePalette;if(p==="stone"){theme="stone";}else if(p==="neon"){theme="neon";}if(s.appearance==="dark"){appearance="dark";}}}var dark=theme==="neon"||appearance==="dark";var color="#F3F0E9";if(theme==="neon"){color="#111113";}else if(dark&&theme==="stone"){color="#151515";}else if(dark){color="#171512";}else if(theme==="stone"){color="#F4F4F1";}var scheme=dark?"dark":"light";var status=dark?"black-translucent":"default";var root=document.documentElement;root.setAttribute("data-theme",theme);root.setAttribute("data-appearance",appearance);root.style.colorScheme=scheme;function ensure(name){var meta=document.querySelector('meta[name="'+name+'"]');if(!meta){meta=document.createElement("meta");meta.setAttribute("name",name);document.head.appendChild(meta);}return meta;}ensure("theme-color").setAttribute("content",color);ensure("color-scheme").setAttribute("content",scheme);ensure("apple-mobile-web-app-status-bar-style").setAttribute("content",status);}catch(e){document.documentElement.setAttribute("data-theme","classic");document.documentElement.setAttribute("data-appearance","light");document.documentElement.style.colorScheme="light";}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="es-AR"
      className={sourceSans.variable}
      data-theme="classic"
      data-appearance="light"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body suppressHydrationWarning>
        <AppClient>{children}</AppClient>
      </body>
    </html>
  );
}

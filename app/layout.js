import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Arnold",
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F3F0E9",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={`${cormorant.variable} ${sourceSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { ArnoldProvider } from "@/context/ArnoldContext";
import { SpotifyProvider } from "@/context/SpotifyContext";
import { AppShell } from "@/components/app/AppShell";
import { ServiceWorkerRegister } from "@/components/app/ServiceWorkerRegister";

export function AppClient({ children }) {
  const pathname = usePathname() || "/";
  const isSpotifyCallback = pathname.startsWith("/spotify/callback");

  return (
    <ArnoldProvider>
      <ServiceWorkerRegister />
      {isSpotifyCallback ? (
        children
      ) : (
        <SpotifyProvider>
          <AppShell />
        </SpotifyProvider>
      )}
    </ArnoldProvider>
  );
}

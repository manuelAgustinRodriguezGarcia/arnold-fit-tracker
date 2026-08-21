"use client";

import { ArnoldProvider } from "@/context/ArnoldContext";
import { AppShell } from "@/components/app/AppShell";
import { ServiceWorkerRegister } from "@/components/app/ServiceWorkerRegister";

export function AppClient({ children }) {
  return (
    <ArnoldProvider>
      <ServiceWorkerRegister />
      <AppShell />
      {children}
    </ArnoldProvider>
  );
}

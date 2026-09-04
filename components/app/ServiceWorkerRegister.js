"use client";

import { useEffect } from "react";

function clearDevServiceWorkers() {
  return Promise.all([
    navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    ),
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("arnold-"))
          .map((key) => caches.delete(key)),
      ),
    ),
  ]);
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return undefined;
    }

    if (process.env.NODE_ENV !== "production") {
      clearDevServiceWorkers().catch(() => {});
      return undefined;
    }

    function register() {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Arnold: no se pudo registrar el service worker", error);
      });
    }

    if (document.readyState === "complete") {
      register();
      return undefined;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

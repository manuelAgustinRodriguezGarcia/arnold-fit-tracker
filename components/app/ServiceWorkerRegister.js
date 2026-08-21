"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
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

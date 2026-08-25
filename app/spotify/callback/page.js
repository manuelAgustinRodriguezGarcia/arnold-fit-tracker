"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeSpotifyCallback } from "@/lib/spotify/auth";
import { MESSAGES } from "@/lib/spotify/constants";
import { getReturnUrl } from "@/lib/spotify/storage";
import styles from "./callback.module.css";

let callbackAttempt = null;

function completeOnce(params) {
  if (!callbackAttempt) {
    callbackAttempt = completeSpotifyCallback(params).catch((error) => {
      callbackAttempt = null;
      throw error;
    });
  }
  return callbackAttempt;
}

function CallbackFallback() {
  return (
    <main className={styles.screen}>
      <p>Conectando Spotify…</p>
    </main>
  );
}

function SpotifyCallbackClient() {
  const router = useRouter();
  const [message, setMessage] = useState("Conectando Spotify…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("code") && !params.get("error")) {
      const timeout = window.setTimeout(() => {
        setMessage(MESSAGES.connectFailed);
        router.replace(getReturnUrl() || "/");
      }, 1600);
      return () => window.clearTimeout(timeout);
    }

    let cancelled = false;
    const fallback = getReturnUrl();

    completeOnce(params)
      .then((returnUrl) => {
        if (!cancelled) {
          router.replace(returnUrl || fallback || "/");
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setMessage(error?.message || MESSAGES.connectFailed);
        window.setTimeout(() => {
          router.replace(fallback || "/");
        }, 1600);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className={styles.screen}>
      <p>{message}</p>
    </main>
  );
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <SpotifyCallbackClient />
    </Suspense>
  );
}

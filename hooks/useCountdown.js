"use client";

import { useEffect, useRef, useState } from "react";

export function useCountdown(endsAt, onExpire) {
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
  }, [endsAt]);

  useEffect(() => {
    if (!endsAt) {
      return undefined;
    }

    function refresh() {
      const current = Date.now();
      setNow(current);
      if (!expiredRef.current && new Date(endsAt).getTime() <= current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }

    refresh();
    const intervalId = window.setInterval(refresh, 250);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [endsAt]);

  if (!endsAt) {
    return 0;
  }

  return Math.max(0, new Date(endsAt).getTime() - now);
}
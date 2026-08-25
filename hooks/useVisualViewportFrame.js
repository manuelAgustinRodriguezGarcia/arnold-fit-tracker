"use client";

import { useEffect, useState } from "react";

export function useVisualViewportFrame(active) {
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    if (!active || typeof window === "undefined") {
      return undefined;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return undefined;
    }

    function sync() {
      const keyboardInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setFrame({
        top: viewport.offsetTop,
        height: viewport.height,
        keyboardInset,
      });
    }

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [active]);

  return active ? frame : null;
}

"use client";

import { useEffect } from "react";

let lockCount = 0;
let scrollY = 0;

function applyLock() {
  if (typeof document === "undefined") {
    return;
  }
  const html = document.documentElement;
  const body = document.body;
  scrollY = window.scrollY;
  html.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
}

function removeLock() {
  if (typeof document === "undefined") {
    return;
  }
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  window.scrollTo(0, scrollY);
}

export function lockBodyScroll() {
  if (typeof document === "undefined") {
    return () => {};
  }
  if (lockCount === 0) {
    applyLock();
  }
  lockCount += 1;
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      removeLock();
    }
  };
}

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    return lockBodyScroll();
  }, [active]);
}

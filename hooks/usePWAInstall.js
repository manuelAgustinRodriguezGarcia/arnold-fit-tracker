"use client";

import { useCallback, useSyncExternalStore } from "react";

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  const ua = window.navigator.userAgent || "";
  const iPadOs =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;

  return /iPhone|iPad|iPod/i.test(ua) || iPadOs;
}

function subscribeStandalone(callback) {
  const standalone = window.matchMedia("(display-mode: standalone)");
  const fullscreen = window.matchMedia("(display-mode: fullscreen)");
  standalone.addEventListener("change", callback);
  fullscreen.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    standalone.removeEventListener("change", callback);
    fullscreen.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function subscribeNoop() {
  return () => {};
}

function getTrue() {
  return true;
}

function getFalse() {
  return false;
}

let installPrompt = null;
const promptListeners = new Set();

function notifyPromptListeners() {
  promptListeners.forEach((listener) => listener());
}

function onBeforeInstall(event) {
  event.preventDefault();
  installPrompt = event;
  notifyPromptListeners();
}

function onInstalled() {
  installPrompt = null;
  notifyPromptListeners();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onInstalled);
}

function subscribeInstallPrompt(listener) {
  promptListeners.add(listener);
  return () => promptListeners.delete(listener);
}

function getInstallPromptSnapshot() {
  return installPrompt;
}

function getNull() {
  return null;
}

function clearInstallPrompt() {
  installPrompt = null;
  notifyPromptListeners();
}

function useInstallPrompt() {
  return useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getNull,
  );
}

export function usePWAInstall() {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    isStandaloneMode,
    getFalse,
  );
  const isIos = useSyncExternalStore(subscribeNoop, isIosDevice, getFalse);
  const ready = useSyncExternalStore(subscribeNoop, getTrue, getFalse);
  const deferredPrompt = useInstallPrompt();

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { ok: false };
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    clearInstallPrompt();
    return { ok: choice.outcome === "accepted" };
  }, [deferredPrompt]);

  const canPrompt = Boolean(deferredPrompt) && !isStandalone;
  const showIosGuide = ready && isIos && !isStandalone && !deferredPrompt;
  const canShowInstall = ready && !isStandalone && (canPrompt || showIosGuide);

  return {
    ready,
    isStandalone,
    isIos,
    canPrompt,
    showIosGuide,
    canShowInstall,
    promptInstall,
  };
}

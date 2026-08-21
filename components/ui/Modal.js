"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import styles from "./Modal.module.css";

const EXIT_MS = 200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const visibleRef = useRef(open);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const exitTimeoutRef = useRef(0);
  const requestCloseRef = useRef(() => {});

  visibleRef.current = visible;
  onCloseRef.current = onClose;

  function clearExitTimeout() {
    if (exitTimeoutRef.current) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = 0;
    }
  }

  function playExit(after) {
    if (closingRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      setVisible(false);
      setClosing(false);
      closingRef.current = false;
      after?.();
      return;
    }

    setClosing(true);
    closingRef.current = true;
    clearExitTimeout();
    exitTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
      closingRef.current = false;
      after?.();
    }, EXIT_MS);
  }

  function requestClose() {
    playExit(() => onCloseRef.current());
  }

  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (open) {
      clearExitTimeout();
      setVisible(true);
      setClosing(false);
      closingRef.current = false;
      return undefined;
    }

    if (!visibleRef.current) {
      return undefined;
    }

    if (closingRef.current) {
      return undefined;
    }

    playExit();
    return () => {
      clearExitTimeout();
      closingRef.current = false;
    };
  }, [open]);

  useEffect(() => {
    return () => clearExitTimeout();
  }, []);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        requestCloseRef.current();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className={`${styles.overlay} ${closing ? styles.closing : ""}`}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Cerrar"
        onClick={requestClose}
      />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "arnold-modal-title" : undefined}
      >
        <div className={styles.header}>
          {title ? (
            <h2 id="arnold-modal-title" className={styles.title}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          <IconButton label="Cerrar" onClick={requestClose}>
            <X size={20} />
          </IconButton>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}

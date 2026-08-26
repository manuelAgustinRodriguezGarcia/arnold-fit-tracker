"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useVisualViewportFrame } from "@/hooks/useVisualViewportFrame";
import styles from "./Modal.module.css";

const EXIT_MS = 200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Modal({
  open,
  title,
  titleMeta,
  headerVariant = "default",
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

  useBodyScrollLock(visible);
  const viewportFrame = useVisualViewportFrame(visible);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        requestCloseRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const overlayStyle = viewportFrame
    ? {
        top: viewportFrame.top,
        height: viewportFrame.height,
        bottom: "auto",
      }
    : undefined;
  const keyboardOpen = Boolean(viewportFrame && viewportFrame.keyboardInset > 80);

  const node = (
    <div
      className={`${styles.overlay} ${closing ? styles.closing : ""}`}
      style={overlayStyle}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Cerrar"
        onClick={requestClose}
      />
      <div
        className={`${styles.sheet} ${keyboardOpen ? styles.sheetKeyboard : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "arnold-modal-title" : undefined}
      >
        <div
          className={`${styles.header} ${headerVariant === "bronze" ? styles.headerBronze : ""}`}
        >
          {title ? (
            <h2 id="arnold-modal-title" className={styles.title}>
              {title}
              {titleMeta ? (
                <>
                  <span className={styles.titleSep} aria-hidden="true">
                    |
                  </span>
                  <span className={styles.titleMeta}>{titleMeta}</span>
                </>
              ) : null}
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

  if (typeof document === "undefined") {
    return node;
  }

  return createPortal(node, document.body);
}

import styles from "./Logo.module.css";

export const LOGO_WORDMARK_SRC = "/logo-arnold.svg";
export const LOGO_MARK_SRC = "/logo-square-arnold.svg";
export const LOGO_LOADING_SRC = "/logo-arnold-loading.svg";

export const PALETTE_WORDMARKS = {
  classic: {
    light: "/logo-arnold.svg",
    dark: "/logo-classic-dark-04.svg",
  },
  stone: {
    light: "/logo-stone-light-04.svg",
    dark: "/logo-stone-dark-04.svg",
  },
  neon: {
    dark: "/logo-neon-dark-04.svg",
  },
};

const WORDMARK_RATIO = 972.65 / 204.11;
const LOADING_RATIO = 1000 / 1140.44;

export function Logo({
  variant = "wordmark",
  height = 28,
  size,
  alt = "Arnold",
  className = "",
}) {
  const resolvedHeight = size || height;
  const width = Math.round(resolvedHeight * WORDMARK_RATIO);

  if (variant === "mark") {
    return (
      <img
        src={LOGO_MARK_SRC}
        alt={alt}
        width={resolvedHeight}
        height={resolvedHeight}
        decoding="async"
        className={className}
      />
    );
  }

  if (variant === "loading") {
    return (
      <img
        src={LOGO_LOADING_SRC}
        alt={alt}
        width={Math.round(resolvedHeight * LOADING_RATIO)}
        height={resolvedHeight}
        decoding="async"
        className={className}
      />
    );
  }

  return (
    <span
      className={`${styles.wordmark} ${className}`.trim()}
      style={{ height: resolvedHeight }}
    >
      <img
        src={PALETTE_WORDMARKS.classic.light}
        alt={alt}
        width={width}
        height={resolvedHeight}
        decoding="async"
        className={styles.classicLight}
      />
      <img
        src={PALETTE_WORDMARKS.classic.dark}
        alt=""
        width={width}
        height={resolvedHeight}
        decoding="async"
        className={styles.classicDark}
        aria-hidden="true"
      />
      <img
        src={PALETTE_WORDMARKS.stone.light}
        alt=""
        width={width}
        height={resolvedHeight}
        decoding="async"
        className={styles.stoneLight}
        aria-hidden="true"
      />
      <img
        src={PALETTE_WORDMARKS.stone.dark}
        alt=""
        width={width}
        height={resolvedHeight}
        decoding="async"
        className={styles.stoneDark}
        aria-hidden="true"
      />
      <img
        src={PALETTE_WORDMARKS.neon.dark}
        alt=""
        width={width}
        height={resolvedHeight}
        decoding="async"
        className={styles.neon}
        aria-hidden="true"
      />
    </span>
  );
}

export const LOGO_WORDMARK_SRC = "/logo-arnold.svg";
export const LOGO_MARK_SRC = "/logo-square-arnold.svg";
export const LOGO_LOADING_SRC = "/logo-arnold-loading.svg";

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
  let src = LOGO_WORDMARK_SRC;
  let width = Math.round(resolvedHeight * WORDMARK_RATIO);

  if (variant === "mark") {
    src = LOGO_MARK_SRC;
    width = resolvedHeight;
  } else if (variant === "loading") {
    src = LOGO_LOADING_SRC;
    width = Math.round(resolvedHeight * LOADING_RATIO);
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={resolvedHeight}
      decoding="async"
      className={className}
    />
  );
}

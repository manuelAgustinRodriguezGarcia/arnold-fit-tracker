import styles from "./Button.module.css";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${styles.icon} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

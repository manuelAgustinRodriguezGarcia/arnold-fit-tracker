import styles from "./Card.module.css";

export function Card({
  children,
  className = "",
  as: Component = "div",
  ...props
}) {
  const buttonProps = Component === "button" ? { type: "button" } : {};

  return (
    <Component
      className={`${styles.card} ${className}`}
      {...buttonProps}
      {...props}
    >
      {children}
    </Component>
  );
}

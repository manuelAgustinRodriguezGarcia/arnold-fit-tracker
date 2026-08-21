import { Button } from "@/components/ui/Button";
import styles from "./EmptyState.module.css";

export function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <div className={styles.empty}>
      {icon}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionLabel ? (
        <Button onClick={onAction} icon={null}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
